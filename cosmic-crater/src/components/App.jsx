import React, { useEffect, useState, useRef } from 'react';
import { 
	BrowserRouter, 
	Routes, 
	Route } from 'react-router-dom';
import Menu from './users/menu/Menu';
import ShowMenuItem from './users/menu/MenuItem';
import RestaurantsList from './users/RestaurantsList';
import Cart from './users/Cart';
import Admin from './restaurants/Admin';
import Admin2 from './restaurants/Admin2';
import Checkout from './users/checkout/Checkout';
import Success from './users/checkout/Success';
import Failure from './users/checkout/Failure';
import axios from 'axios';
import qs from 'qs';
import UserOrders from './users/UserOrders';
import DriverOrders from './drivers/DriverOrders';
import Users from './users/Users';
import Donate from './users/Donate';
import BottomNavbar from './users/BottomNavbar';
import Navbar from './users/Navbar';

export const API_URL = false ?
	"http://localhost:8080"
:
	"https://www.rivcodelivery.com";
export const MAX_RETRY_ATTEMPTS = 3;

export function App() {
	const [cart, setCart] = useState([]);
	const [cartAmount, setCartAmount] = useState(0);
	const [restaurant, setRestaurant] = useState(-1);
	const [restaurantName, setRestaurantName] = useState("");
	const [restaurantAddress, setRestaurantAddress] = useState("");
	const [deliveryFee, setDeliveryFee] = useState(0.00);
	const [menuItem, setMenuItem] = useState(-1);
	const [showGetLocation, setShowGetLocation] = useState(true);
	const [address, setAddress] = useState("");
	const [debug, setDebug] = useState(true);
	const [distance, setDistance] = useState(0);
	const [latitude, setLatitude] = useState(null);
	const [longitude, setLongitude] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loginLoading, setLoginLoading] = useState(false);
	useEffect(() => {
		console.log("useEffect App");
		let ca = 0;
		for (const item in cart) {
			ca += cart[item].quantity;
		}
		setCartAmount(ca);
		const fetchProfile = async () => {
			const storedProfile = localStorage.getItem('profile');
			if (storedProfile) {
				setProfile(JSON.parse(storedProfile));
			}
		};
		fetchProfile().catch(error => 
			 console.error('Error in fetchProfile:', error));
	}, [cart, setCart, setCartAmount]);

	let USDollar = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});

	function Success() {
		const navigate = useNavigate();
		const homeButton = (e) => {
			e.preventDefault();
			navigate("/");
		}
		useEffect(() => {
			console.log("#### Success useEffect ####");
		}
		, []);
		return (
			<div className="text-center">
				<h1 className="text-success">
					<i className="bi bi-check-circle-fill"> </i>
					Your order has been received!
				</h1>
				<ol>
					<li>Your delivery driver will be notified shortly.</li>
					<li>We may contact you if there are any issues with your order.</li>
				</ol>
				<button
					onClick={(e)=>homeButton(e)} 
					className="btn btn-primary mt-2">
						Return to Restaurants list
				</button>
			</div>
		);
	}

	function WhiteArea() {
		return (
			<BrowserRouter>
				<div id="wr">
					<Navbar 
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
					<div id="white-area" className="mx-auto p-3 blackborder">
						<Routes>
							<Route
								path='*'
								exact={true}
								element={
									<RestaurantsList
										USDollar={USDollar}
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
									/>
								}
							/>
							<Route
								path={"/orders"}
								element={
									<DriverOrders />
								}
							/>
							<Route
								path={"/users"}
								element={
									<Users />
								}
							/>
							<Route
								path={"/user-orders"}
								element={
									<UserOrders />
								}
							/>
							<Route
								path={"/success"}
								element={
									<Success />
								}
							/>
							<Route
								path={"/failure"}
								element={
									<Failure />
								}
							/>
							<Route
								path={"/menu"}
								element={
									<Menu
										restaurantName={restaurantName}
										restaurant={restaurant}
										menuItem={menuItem}
										setMenuItem={setMenuItem}
									/>
								}
							/>
							<Route
								path={"/menu/item"}
								element={
									<ShowMenuItem
										USDollar={USDollar}
										cartAmount={cartAmount}
										setCartAmount={setCartAmount}
										restaurant={restaurant}
										restaurantName={restaurantName}
										restaurantAddress={restaurantAddress}
										menuItem={menuItem}
										debug={debug}
										cart={cart}
										setCart={setCart} />
								}
							/>
							<Route
								path={"/cart"}
								element={
									<Cart
										showGetLocation={showGetLocation}
										setShowGetLocation={setShowGetLocation}
										address={address}
										USDollar={USDollar}
										cartAmount={cartAmount}
										setCartAmount={setCartAmount}
										cart={cart}
										setCart={setCart} />
								} 
							/>
							<Route
								path={"/checkout"}
								element={
									<Checkout
										USDollar={USDollar}
										cart={cart}
										setCart={setCart}
										showGetLocation={showGetLocation}
										setShowGetLocation={setShowGetLocation}
										address={address}
										setAddress={setAddress}
										restaurantAddress={restaurantAddress}
										setRestaurantAddress={setRestaurantAddress}
										deliveryFee={deliveryFee}
										distance={distance}
									/>
								} 
							/>
							<Route
								path={"/admin"}
								element={
									<Admin
										profile={profile}
										latitude={latitude}
										setLatitude={setLatitude}
										longitude={longitude}
										setLongitude={setLongitude} />
								}
							/>
							<Route
								path={"/admin2"}
								element={
									<Admin2 />
								}
							/>
							<Route
								path={"/donate"}
								element={
									<Donate />
								}
							/>
						</Routes>
					</div>
					<BottomNavbar profile={profile} />
				</div>
			</BrowserRouter>
		);
	}
	return (
		WhiteArea()
	);
}

export function dbPost2(e, inputs, route) {
	if (e != null) e.preventDefault(e);
	const url = API_URL + "/api/" + route;
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
	const url = API_URL + "/api/" + route;
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