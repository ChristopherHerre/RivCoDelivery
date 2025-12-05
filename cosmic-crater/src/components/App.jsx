import React, { useEffect, useState, useRef } from 'react';
import { 
	BrowserRouter, 
	Routes, 
	Route,
	Outlet,
	useLocation,
	useNavigate } from 'react-router-dom';
import Menu from './restaurants/menu/Menu';
import MenuItem from './restaurants/menu/menu_items/MenuItem';
import RestaurantsList from './restaurants/RestaurantsList';
import Cart from './users/cart/Cart';
import Admin from './restaurants/Admin';
import Checkout from './users/checkout/CheckoutForm';
import Success from './users/checkout/Success';
import Failure from './users/checkout/Failure';
import axios from 'axios';
import qs from 'qs';
import UserOrders from './users/orders/UserOrders';
import DriverOrders from './drivers/orders/DriverOrders';
import Users from './webmaster/Users';
import Donate from './users/nav/Donate';
import BottomNavbar from './users/nav/BottomNavbar';
import Navbar from './users/nav/Navbar';
import TaxiFareCalculator from './users/address/TaxiFareCalculator';
import RedirectToNewUrl from './RedirectToNewUrl';
import { parseRestaurantId, getRestaurantMenuUrl } from '../utils/restaurantUrls';

export const API_URL = false ?
	"http://localhost:8080"
:
	"https://rivcodelivery.com";
export const MAX_RETRY_ATTEMPTS = 3;

function Layout(props) {
	const cart = props.cart;
	return (
		<div id="wr">
			<Navbar 
				cart={cart}
				profile={props.profile} 
				setProfile={props.setProfile}
				loginLoading={props.loginLoading}
				setLoginLoading={props.setLoginLoading}
				address={props.address}
				setAddress={props.setAddress}
				showGetLocation={props.showGetLocation}
				setShowGetLocation={props.setShowGetLocation}
				cartAmount={props.cartAmount}
			/>
			<div id="white-area" className="blackborder">
				<Outlet />
			</div>
			<BottomNavbar profile={props.profile} />
		</div>
	);
}

export function App() {
	const [cart, setCart] = useState([]);
	const [cartAmount, setCartAmount] = useState(0);
	const [restaurant, setRestaurant] = useState(-1);
	const [restaurantName, setRestaurantName] = useState("");
	const [restaurantAddress, setRestaurantAddress] = useState("");
	const [deliveryFee, setDeliveryFee] = useState(0.00);
	const [menuItem, setMenuItem] = useState(-1);
	// When the app first loads, we haven't yet checked whether the user has
	// an address saved in the backend. Start with "not showing" the welcome
	// screen; the address check in RestaurantsList will turn it on only if
	// there is no saved address.
	const [showGetLocation, setShowGetLocation] = useState(false);
	const [address, setAddress] = useState("");
	const [debug, setDebug] = useState(false);
	const [distance, setDistance] = useState(0);
	const [latitude, setLatitude] = useState(null);
	const [longitude, setLongitude] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loginLoading, setLoginLoading] = useState(false);
	const [cartLoading, setCartLoading] = useState(true);
	useEffect(() => {
		console.log("useEffect App - Cart Amount");
		let ca = 0;
		for (const item in cart) {
			ca += cart[item].quantity;
		}
		setCartAmount(ca);
	}, [cart]); // Only depend on cart changes for amount calculation

	function DeepLinkHandler() {
		const location = useLocation();
		const navigate = useNavigate();
		const handledRef = useRef(false);

		useEffect(() => {
			if (handledRef.current) return;

			const params = new URLSearchParams(location.search);
			const view = params.get('view');
			const restaurantParam = params.get('restaurant');

			if (view === 'menu' && restaurantParam) {
				const idNum = Number(restaurantParam);
				if (!Number.isNaN(idNum) && idNum > 0) {
					setRestaurant(idNum);
					handledRef.current = true;
					// Fetch restaurant data to build the correct URL
					axios.get(`/api/public/restaurants/${idNum}`)
						.then(res => {
							const restaurantData = res.data;
							if (restaurantData) {
								navigate(getRestaurantMenuUrl(restaurantData), { replace: true });
							} else {
								// Fallback to old format if restaurant data not available
								navigate(`/${idNum}/menu`, { replace: true });
							}
						})
						.catch(err => {
							console.error('Error fetching restaurant data:', err);
							// Fallback to old format on error
							navigate(`/${idNum}/menu`, { replace: true });
						});
				}
			}
		}, [location.search, navigate]);

		return null;
	}

	// 1. Load profile on mount
	useEffect(() => {
		const storedProfile = localStorage.getItem('profile');
		if (storedProfile) {
			setProfile(JSON.parse(storedProfile));
		}
	}, []);

	// 2. Load cart when profile changes
	useEffect(() => {
		const loadCartFromBackend = async () => {
			if (profile?.sub) {
				try {
					const response = await axios.get('/api/cart');
					if (response.data && Array.isArray(response.data)) {
						setCart(response.data);
					}
				} catch (error) {
					console.error('Error loading cart:', error);
				} finally {
					setCartLoading(false);
				}
			}
		};
		loadCartFromBackend();
	}, [profile]);

	let USDollar = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});
	axios.defaults.withCredentials = true;
	axios.interceptors.response.use(
		res => res,
		err => {
			if (err.response?.status === 401 && localStorage.getItem("profile") != null) {
				localStorage.removeItem('profile');
				window.location.href = '/';
			}
			return Promise.reject(err);
		}
	);
	function WhiteArea() {
		return (
			<BrowserRouter>
				<DeepLinkHandler />
				<Routes>
					<Route
						path="/"
						element={
							<Layout
								cart={cart}
								profile={profile}
								setProfile={setProfile}
								loginLoading={loginLoading}
								setLoginLoading={setLoginLoading}
								address={address}
								setAddress={setAddress}
								showGetLocation={showGetLocation}
								setShowGetLocation={setShowGetLocation}
								cartAmount={cartAmount}
							/>
						}
					>
						<Route
							index
							element={
								<RestaurantsList
									USDollar={USDollar}
									restaurant={restaurant}
									setRestaurant={setRestaurant}
									setRestaurantName={setRestaurantName}
									roundedToFixed={roundedToFixed}
									showGetLocation={showGetLocation}
									setShowGetLocation={setShowGetLocation}
									address={address}
									setAddress={setAddress}
									setRestaurantAddress={setRestaurantAddress}
									setDeliveryFee={setDeliveryFee}
									debug={debug}
									setDistance={setDistance}
									latitude={latitude}
									setLatitude={setLatitude}
									longitude={longitude}
									setLongitude={setLongitude}
									cartAmount={cartAmount}
								/>
							}
						/>
						<Route
							path="orders"
							element={<DriverOrders cartAmount={cartAmount} />}
						/>
						<Route
							path="users"
							element={<Users cartAmount={cartAmount} />}
						/>
						<Route
							path="user-orders"
							element={<UserOrders cartAmount={cartAmount} />}
						/>
						<Route
							path="success"
							element={<Success cartAmount={cartAmount} />}
						/>
						<Route
							path="failure"
							element={<Failure cartAmount={cartAmount} />}
						/>
						<Route
							path="admin"
							element={
								<Admin
									profile={profile}
									latitude={latitude}
									setLatitude={setLatitude}
									longitude={longitude}
									setLongitude={setLongitude}
									cartAmount={cartAmount}
								/>
							}
						/>
						<Route
							path="donate"
							element={<Donate cartAmount={cartAmount} />}
						/>
						<Route
							path="taxi"
							element={<TaxiFareCalculator cartAmount={cartAmount} />}
						/>
						{/* New routes matching SSR format: /restaurants/:city/:restaurant */}
						<Route
							path="restaurants/:city/:restaurant"
							element={
								<Menu
									menuItem={menuItem}
									setMenuItem={setMenuItem}
									cartAmount={cartAmount}
								/>
							}
						/>
						<Route
							path="restaurants/:city/:restaurant/menu/item"
							element={
								<MenuItem
									USDollar={USDollar}
									cartAmount={cartAmount}
									setCartAmount={setCartAmount}
									debug={debug}
									cart={cart}
									setCart={setCart}
								/>
							}
						/>
						<Route
							path="restaurants/:city/:restaurant/cart"
							element={
								<Cart
									showGetLocation={showGetLocation}
									setShowGetLocation={setShowGetLocation}
									address={address}
									USDollar={USDollar}
									cartAmount={cartAmount}
									setCartAmount={setCartAmount}
									cart={cart}
									setCart={setCart}
								/>
							}
						/>
						<Route
							path="restaurants/:city/:restaurant/checkout"
							element={
								<Checkout
									USDollar={USDollar}
									address={address}
									setAddress={setAddress}
									restaurantAddress={restaurantAddress}
									setRestaurantAddress={setRestaurantAddress}
									deliveryFee={deliveryFee}
									distance={distance}
									cartAmount={cartAmount}
									cart={cart}
									setCart={setCart}
									cartLoading={cartLoading}
								/>
							}
						/>
						{/* Backward compatibility: redirect old format to new format */}
						<Route
							path=":restaurant/menu"
							element={<RedirectToNewUrl />}
						/>
						<Route
							path=":restaurant/menu/item"
							element={<RedirectToNewUrl />}
						/>
						<Route
							path=":restaurant/cart"
							element={<RedirectToNewUrl />}
						/>
						<Route
							path=":restaurant/checkout"
							element={<RedirectToNewUrl />}
						/>
						<Route
							path="*"
							element={
								<RestaurantsList
									USDollar={USDollar}
									restaurant={restaurant}
									setRestaurant={setRestaurant}
									setRestaurantName={setRestaurantName}
									roundedToFixed={roundedToFixed}
									showGetLocation={showGetLocation}
									setShowGetLocation={setShowGetLocation}
									address={address}
									setAddress={setAddress}
									setRestaurantAddress={setRestaurantAddress}
									setDeliveryFee={setDeliveryFee}
									debug={debug}
									setDistance={setDistance}
									latitude={latitude}
									setLatitude={setLatitude}
									longitude={longitude}
									setLongitude={setLongitude}
									cartAmount={cartAmount}
								/>
							}
						/>
					</Route>
				</Routes>
			</BrowserRouter>
		);
	}
	return (
		WhiteArea()
	);
}

export function dbPost2(e, inputs, route) {
	if (e != null) e.preventDefault(e);
	const url = "/api/" + route;
	const options = {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		},
		data: qs.stringify(inputs),
		url,
	};
	const postData = async () => {
		await axios(options);
	};
	try {
		postData();
	} catch (err) {
		console.log(err);
	}
}

export function dbGet(e, inputs, route) {
	if (e != null) e.preventDefault(e);
	const url = "/api/" + route;
	const options = {
		method: 'GET',
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		},
		data: qs.stringify(inputs),
		url,
	};
	const getData = async () => {
		await axios(options);
	};
	try {
		getData();
	} catch (err) {
		console.log(err);
	}
}

export function roundedToFixed(input, digits) {
	var rounder = Math.pow(10, digits);
	var result = (Math.round(input * rounder) / rounder).toFixed(digits);
	return result;
}

export default App;