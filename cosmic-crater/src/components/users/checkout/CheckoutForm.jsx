import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import currency from 'currency.js';
import { CartItemDetails, calcSubtotal, Subtotal, Ingredients } from '../cart/Cart';
import { roundedToFixed } from '../../App';
import { getStreetOnly, haversine_dist } from '../../restaurants/RestaurantsList';
import axios from 'axios';
import Spinner from '../Spinner';
import { getFullAddress } from '../address/DeliveryAddress';
import OrderReview from './OrderReview';

export default function CheckoutForm(props) {
	const USDollar = props.USDollar;
	const address = props.address;
	const distance = props.distance;
	const cart = props.cart;
	const setCart = props.setCart;
	//const r = props.restaurant;
	const [restaurantAddress, setRestaurantAddress] = useState("");	
	//const [cart, setLocalCart] = useState([]);
	const [subtotal, setSubtotal] = useState(0.00);
	const [businessType1, setBusinessType1] = useState(1);
	const [businessType2, setBusinessType2] = useState(0);
	const [businessType3, setBusinessType3] = useState(0);
	const [textAreaValue, setTextAreaValue] = useState("");
	const [knockType1, setKnockType1] = useState(1);
	const [knockType2, setKnockType2] = useState(0);
	const [knockType3, setKnockType3] = useState(0);
	const [total, setTotal] = useState(0.00);
	const [tax, setTax] = useState(0.00);
	const [loading, setLoading] = useState(false);
	const [cartLoading, setCartLoading] = useState(true);
	const [userLat, setUserLat] = useState(null);
	const [userLng, setUserLng] = useState(null);
	const [restaurantLat, setRestaurantLat] = useState(null);
	const [restaurantLng, setRestaurantLng] = useState(null);
	const [restaurantName, setRestaurantName] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const fetchCart = async () => {
			const profile = JSON.parse(localStorage.getItem('profile'));
			if (!profile?.sub) {
				console.log("No profile found");
				navigate("/");
				return;
			}
			try {
				const response = await axios.get('/api/cart', {
					headers: {
						Authorization: `Bearer ${profile.sub}`
					},
					withCredentials: true
				});
				if (response.data && Array.isArray(response.data)) {
					//setLocalCart(response.data);
					setCart(response.data);
					if (response.data.length === 0) {
						console.log("Cart is empty2");
						navigate("/");
					}
				}
			} catch (error) {
				console.error('Error loading cart:', error);
				navigate("/");
			} finally {
				setCartLoading(false);
			}
		};
		fetchCart();
	}, [navigate, setCart]);

	useEffect(() => {
		const fetchLocations = async () => {
			const profile = JSON.parse(localStorage.getItem('profile'));
			if (!profile?.sub) return;
			try {
				if (cart[0] === undefined) {
					console.log("Cart is empty3");
					//navigate("/");
					return;
				}
				const response = await axios.get(`/api/checkout-data/${cart[0].restaurant_id}`,
					{ withCredentials: true });
				const { userAddress, restaurant } = response.data;
				if (!userAddress) {
					throw new Error('User address not found');
				}
				setUserLat(userAddress.address_latitude);
				setUserLng(userAddress.address_longitude);
				if (restaurant) {
					setRestaurantLat(restaurant.latitude);
					setRestaurantLng(restaurant.longitude);
					if (restaurant.address) {
						setRestaurantAddress(restaurant.address);
					}
					if (restaurant.name) {
						setRestaurantName(restaurant.name);
					}
				}
			} catch (error) {
				console.error('Error fetching locations:', error);
				setLoading(false);
				setUserLat(0);
				setUserLng(0);
				setRestaurantLat(0);
				setRestaurantLng(0);
				setRestaurantAddress('');
			} finally {
				setLoading(false);
			}
		};
		fetchLocations();
	}, [cartLoading]);

	useEffect(() => {
		if (cart.length > 0) {
			let newSubtotal = calcSubtotal(cart, setSubtotal);
			setSubtotal(newSubtotal);
		}
	}, [cart]);

	const deliveryFee = (userLat && userLng && restaurantLat && restaurantLng)
		? 10 + (haversine_dist(restaurantLat, restaurantLng, userLat, userLng) < 1
			? 1
			: haversine_dist(restaurantLat, restaurantLng, userLat, userLng))
		: null;

	return (cartLoading || deliveryFee == null ? <Spinner /> : cart.length > 0 ? (
		<form onSubmit={(e) => submit(e)}>
			<h1>Checkout</h1>
			<div className="flex flex-wrap">
				<DeliveryInstructions 
					setTextAreaValue={setTextAreaValue} 
				/>
				<BusinessTypes
					businessType1={businessType1}
					setHome={setHome}
					businessType2={businessType2}
					setApartment={setApartment}
					businessType3={businessType3}
					setBusiness={setBusiness}
				/>
				<KnockTypes
					knockType1={knockType1}
					setKnock={setKnock}
					knockType2={knockType2}
					setRing={setRing}
					knockType3={knockType3}
					setLeave={setLeave}
				/>
			</div>
			<OrderReview
				USDollar={USDollar}
				cart={cart}
				subtotal={subtotal}
				deliveryFee={deliveryFee}
				tax={tax}
				setTax={setTax}
				total={total}
				setTotal={setTotal}
				loading={loading}
			/>
			{loading && <Spinner />}
		</form>) : <h1>Error: You cannot view this page right now.</h1>
	);

	async function submit(e) {
		e.preventDefault();
		setLoading(true);
		const businessTypes = ["Home", "Apartment", "Business"];
		const knockTypes = ["Knock on door", "Ring doorbell", "Leave at door"];
		const btIndex = [businessType1, businessType2, businessType3]
			.findIndex(val => val == 1);
		const ktIndex = [knockType1, knockType2, knockType3]
			.findIndex(val => val == 1);
		const bt = businessTypes[btIndex] || "";
		const kt = knockTypes[ktIndex] || "";
		let cartClone = [];
		for (let i = 0; i < cart.length; i++) {
			const vals = [cart[i].val1, cart[i].val2, cart[i].val3, cart[i].val4];
			const sizes = [cart[i].size1, cart[i].size2, cart[i].size3, cart[i].size4];
			const idx = vals.findIndex(v => v == 1);
			const size = sizes[idx] || "";
			const cartData = [
				cart[i].name,
				size,
				cart[i].price,
				cart[i].quantity,
				Ingredients(cart[i], 0),
			];
			cartClone.push(cartData);
		}
		const profile = JSON.parse(localStorage.getItem('profile'));
		const googleId = profile ? profile.sub : null;
		if (!googleId) {
			console.error('Google ID not found in local storage');
			navigate("/failure");
			setLoading(false);
			return;
		}
        let users_table_address = await getFullAddress(address);
		await placeOrder(googleId, users_table_address, cartClone, bt, kt);
	}

	async function placeOrder(googleId, users_table_address, cartClone, bt, kt) {
		const userInputData = [
			users_table_address,
			textAreaValue,
			bt,
			kt,
		];
		console.log("Placing order with data:", {
			userInputData,
			cartClone,
			googleId
		});
		try {
			const response = await axios.post('/api/co', [userInputData, cartClone], {
				headers: {
					Authorization: `Bearer ${googleId}`
				},
				withCredentials: true
			});
			if (response.status === 201) {
				await axios.delete('/api/cart', { 
					data: { userId: googleId },
					withCredentials: true
				});
				setCart([]);
				navigate("/success");
			} else {
				console.error("Unexpected response status:", response.status);
				navigate("/failure");
			}
		} catch (error) {
			console.error('Error placing order:', error.response?.data || error.message);
			navigate("/failure");
		} finally {
			setLoading(false);
		}
	}

	function setHome() {
		setBusinessType1(true)
		setBusinessType2(false)
		setBusinessType3(false)
	}
	function setApartment() {
		setBusinessType1(false)
		setBusinessType2(true)
		setBusinessType3(false)
	}
	function setBusiness() {
		setBusinessType1(false)
		setBusinessType2(false)
		setBusinessType3(true)
	}
	function setKnock() {
		setKnockType1(true)
		setKnockType2(false)
		setKnockType3(false)
	}
	function setRing() {
		setKnockType1(false)
		setKnockType2(true)
		setKnockType3(false)
	}
	function setLeave() {
		setKnockType1(false)
		setKnockType2(false)
		setKnockType3(true)
	}
}

export function KnockTypes(props) {
	const knockType1 = props.knockType1;
  	const setKnock = props.setKnock;
  	const knockType2 = props.knockType2
  	const setRing = props.setRing;
  	const knockType3 = props.knockType3;
  	const setLeave = props.setLeave;
	return (
		<div className="w-full md:w-1/2">
			<h5 className="m-1">
				<span className="text-red-600">
					*
				</span>
				Drop-off type
			</h5>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={knockType1} 
						onChange={(e) => setKnock()} 
						name="knocktype" 
						type="radio" 
					/> Knock on door
				</label>
			</div>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={knockType2}
						onChange={(e) => setRing()} 
						name="knocktype" 
						type="radio"
					/> Ring doorbell
				</label>
			</div>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={knockType3}
						onChange={(e) => setLeave()} 
						name="knocktype"
						type="radio"
					/> Leave at door
				</label>
			</div>
		</div>
	)
}

export function BusinessTypes(props) {
	const businessType1 = props.businessType1;
  	const setHome = props.setHome;
  	const businessType2 = props.businessType2
  	const setApartment = props.setApartment;
  	const businessType3 = props.businessType3;
  	const setBusiness = props.setBusiness;
	return (
		<div className="w-full md:w-1/2">
			<h5 className="m-1">
				<span className="text-red-600">
					*
				</span>
				Destination type
			</h5>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={businessType1} 
						onChange={(e) => setHome()} 
						name="deliverytype" 
						type="radio" 
					/> Home
				</label>
			</div>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={businessType2}
						onChange={(e) => setApartment()} 
						name="deliverytype" 
						type="radio"
					/> Apartment
				</label>
			</div>
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<label>
					<input 
						required 
						checked={businessType3}
						onChange={(e) => setBusiness()} 
						name="deliverytype"
						type="radio"
					/> Business
				</label>
			</div>
		</div>
	)
}

export function DeliveryInstructions(props) {
	const setTextAreaValue = props.setTextAreaValue;
	return (
		<div className="w-full">
			<div className="bg-gray-900 text-white p-3 m-1 rounded">
				<h4 className="text-white">Delivery Instructions:</h4>
				<textarea
					onChange={(e) => setTextAreaValue(e.target.value)}
					rows="2" 
					placeholder="Enter delivery instructions here..." 
					className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
				/>
			</div>
		</div>
	)
}