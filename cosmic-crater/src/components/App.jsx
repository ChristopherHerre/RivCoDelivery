import React, { useEffect, useState } from 'react';
import { 
	BrowserRouter, 
	Routes, 
	Route, 
	Link } from 'react-router-dom';
import ShowMenu from './users/menu/Menu';
import ShowMenuItem from './users/menu/MenuItem';
import RestaurantsList from './users/RestaurantsList';
import Cart from './users/Cart';
import Admin from './restaurants/Admin';
import Admin2 from './restaurants/Admin2';
import Checkout from './users/Checkout';
import Success from './users/Success';
import Failure from './users/Failure';
import { DeliveryAddress } from './users/RestaurantsList';
import axios from 'axios';
import qs from 'qs';
import UserOrders from './users/UserOrders';
import DriverOrders from './drivers/DriverOrders';
import Users from './users/Users';
import AdminDropdown from './restaurants/AdminDropdown';
import Donate from './users/Donate';
import Spinner from './users/Spinner';
import { 
	GoogleOAuthProvider, 
	GoogleLogin, 
	googleLogout } from '@react-oauth/google';
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
	const [debug, setDebug] = useState(false);
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
	
	function Badge() {
		return (
			cartAmount > 0 ? 
				<span className="badge bg-danger">
					{cartAmount}
				</span>
			: ""
		);
	}

	let USDollar = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});

	function ShowGoogleUserInfo(props) {
		const { profile } = props;
		return (
			profile && (
				<div>
					<h6>Welcome, <img className="google-profile-icon" src={profile.picture} /> 
						<b>{profile.name} </b>
						<a href="#" onClick={handleLogout}>Logout</a>
					</h6>
				</div>
			)
		);
	}

	function handleLogout(e) {
		e.preventDefault();
		localStorage.removeItem('profile');
		googleLogout();
		const logout = async () => {
			try {
				const response = await axios.get(`${API_URL}/api/logout`,
					{ withCredentials: true });
				console.log(response.data.message);
				setProfile(null);
				window.location.href = '/';
			} catch (err) {
				console.error('Error logging out:', err);
			}
		};
		logout().catch(error => 
			console.error('Error in logout:', error));
	}

	const bbbb = () => {
		setLoginLoading(true);
	};

	function webPage() {
		return (
			<BrowserRouter>
				<>
					<div id="wr" className="row">
						<div className="col-12 col-lg-6">
							<Link to="/">
								<button 
										className="removebutton align-text-bottom" 
										type="button">
									<span className="logofont2">RivCo</span>
									<span className="logofont">DELIVERY</span>
								</button>
							</Link>
							<div className="col-12">
								{profile ? <DeliveryAddress 
									showGetLocation={showGetLocation} 
									setShowGetLocation={setShowGetLocation} 
									address={address} 
									setAddress={setAddress}
								/> : 
								<div>
									<label><u className="text-danger">
										You must sign in to place an order!
									</u></label>
								</div>}
							</div>
						</div>
						<div className="col-12 col-lg-6">
							{profile ? <ShowGoogleUserInfo profile={profile} /> : ""}
							<div className="row">
								<div className="col-12 col-md-6">
									{
										
										!profile ? 
											<GoogleOAuthProvider
												clientId="963768506998-q2mre4mniqshf29u8u65ep7cfk0smb36.apps.googleusercontent.com">
												<h2>
													<GoogleLogin
														className="btn btn-secondary form-control mb-1"
														onSuccess={handleGoogleLoginSuccess}
														onFailure={handleGoogleLoginFailure}
														useOneTap
													/>
												</h2>
											</GoogleOAuthProvider>
										: ""
									}
									{profile && loginLoading ? <Spinner /> : ""}
									{profile ? 
										<Link to="/user-orders">
											<button 
													className="btn btn-secondary form-control mb-1" 
													type="button">
												<i className="bi bi-list"></i> My Orders
											</button>
										</Link> : ""
									}
								</div>
								<div className="col-12 col-md-6">
									<Link to="/cart">
										<button 
												className="btn btn-secondary form-control mb-1" 
												type="button">
											<i className="bi bi-cart"></i> Cart <Badge />
										</button>
									</Link>
								</div>
							</div>
						</div>
					</div>
					<div className="mx-auto p-3 blackborder">
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
									<ShowMenu
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
					<div className="row">
						<div className="col-12 d-md-none">
							<AdminDropdown className="mr-1" profile={profile} full={1} />
						</div>
						<div class="dropdown-divider"></div>
						<div className="col-6 d-none d-md-block">
							<AdminDropdown className="mr-1" profile={profile} />
						</div>
					</div>
				</>
			</BrowserRouter>
		);
	}

	async function handleGoogleLoginSuccess(response) {
		console.log('Login Successful', response);
		const login = async (attempt = 1) => {
			try {
				const res = await axios.post(API_URL + '/api/google-login', {
					token: response.credential
				}, { withCredentials: true });		
				console.log('Backend response:', res.data);
				setProfile(res.data);
				localStorage.setItem('profile', JSON.stringify(res.data));
				setLoginLoading(false);
				setShowGetLocation(true);
			} catch (err) {
				if (attempt < MAX_RETRY_ATTEMPTS) {
					console.error('Error verifying token, retrying...', err);
					login(attempt + 1);
				} else {
					console.error('Error verifying token after multiple attempts:', err);
				}
			}
		};
		login().catch(error => console.error('Error in login:', error));
	}

	function handleGoogleLoginFailure(error, attempt, err, login) {
		console.error('Login Failed:', error);
		if (attempt < MAX_RETRY_ATTEMPTS) {
			console.error('Error verifying token, retrying...', err);
			login(attempt + 1);
		} else {
			console.error('Error verifying token after multiple attempts:', err);
		}
	}
	return (
		webPage()
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