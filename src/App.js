import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ShowMenu from './users/ShowMenu';
import ShowMenuItem from './users/ShowMenuItem';
import RestaurantsList from './users/RestaurantsList';
import Cart from './users/Cart';
import Admin from './restaurants/Admin';
import Admin2 from './restaurants/Admin2';
import Checkout from './users/Checkout';
import Success from './users/Success';
import { DeliveryAddress, getFullAddress } from './users/RestaurantsList';
import axios from 'axios';
import qs from 'qs';
import UserOrders from './users/UserOrders';
import DriverOrders from './drivers/DriverOrders';
//import { DeliveryAddress } from './users/RestaurantsList';
import { 
	GoogleOAuthProvider, 
	GoogleLogin, 
	googleLogout } from '@react-oauth/google';

export const API_URL = false ? "http://localhost:8080" : "https://www.rivcodelivery.com";
export const MAX_RETRY_ATTEMPTS = 3;

export function Spinner() {
    return (
        <div className="row text-center">
			<div className="col-12">
				<div className="spinner-border m-2" role="status">
					<span className="sr-only"></span>
				</div>
			</div>
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

	const GoFundMeEmbed = () => {
		return (
			<iframe
				src="https://www.gofundme.com/f/rivcodelivery-customer-and-supplier-management-project/widget/large?sharesheet=managehero&attribution_id=sl:69051672-bc13-4f4b-a0e5-e94edae727d0"
				width="100%"
				height="525"
				frameBorder="0"
				scrolling="no"
				title="GoFundMe"
			></iframe>
		);
	};
	
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
		googleLogout();
		const logout = async () => {
			try {
				const response = await axios.get(`${API_URL}/api/logout`,
					{ withCredentials: true });
				console.log(response.data.message);
				localStorage.removeItem('profile');
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

	const AdminDropdown = (props) => {
		const full = props.full;
		return (
			<div className="dropdown">
				{profile ? <a
					className={full ?
						"btn btn-secondary mt-1 dropdown-toggle form-control"
						:
						"btn btn-secondary mt-1 dropdown-toggle"
					}
					href="#"
					onClick={(e) => e.preventDefault()}
					role="button"
					id="dropdownMenuLink"
					data-bs-toggle="dropdown"
					aria-haspopup="true"
					aria-expanded="false"
				>
					<i className="bi bi-briefcase"> </i>
					Admin
				</a> : ""}
				<Link to="/donate">
					<button className={full ?
							"btn btn-secondary mt-1 mr-1 form-control" 
							: 
							"btn btn-secondary mt-1 mr-1 "}>
						<i className="bi bi-credit-card-fill"> </i>
						Donate
					</button>
				</Link>
				{profile ? <div className="dropdown-menu bg-dark form-control text-white " aria-labelledby="dropdownMenuLink">
					<Link to="/admin" className="dropdown-item text-white hover-black">
						<i className="bi bi-sliders2-vertical"> </i>
						Restaurant Control Panel
					</Link>
					<Link to="/orders" className="dropdown-item text-white hover-black">
						<i className="bi bi-box2"> </i>
						Driver Orders
					</Link>
				</div> : ""}
			</div>
		);
	};

	function webPage() {
		return (
			<BrowserRouter>
				<>
					<div className="row">
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
									<><u className="text-danger">
										You must sign in to place an order!
									</u></>
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
							<AdminDropdown className="mr-1" full={1} />
						</div>
						<div class="dropdown-divider"></div>
						<div className="col-6 d-none d-md-block">
							<AdminDropdown className="mr-1" />
						</div>
					</div>
				</>
			</BrowserRouter>
		);
	}

	function Donate() {
		return (<>
			<div className="row">
				<div className="col-12 col-md-6">
					<h1>Donate Today to Support Continued Development!</h1>
					<p>Donating even a small amount will help me in developing:</p>
					<ol>
						<li>New features</li>
						<li>Bug fixes</li>
						<li>Better documentation</li>
						<li>YouTube videos and tutorials for installing this project live</li>
					</ol>
					<p>Additionally, I am raising money to pay for hosting for this website and other expenses related to this project.</p>
				</div>
				<div className="col-12 col-md-6 text-end">
					<GoFundMeEmbed />
				</div>
			</div>
			<div className="row bg-dark text-white p-5 m-1">
				<div className="col-12 text-center mx-auto">
					<a href="https://github.com/ChristopherHerre/RivCoDelivery">
						<button className="btn btn-lg btn-primary">
							<i className="bi bi-github"> </i>
							Download Project From GitHub
						</button>
					</a>
				</div>
			</div>
		</>);
	}

	function Failure() {
		return (
			<div className="text-center">
				<h1>
					<span className="text-danger">
						<i className="bi bi-exclamation-triangle"> </i>
						There was an error! Your order was not placed.
					</span>
				</h1>
				<h2>Troubleshooting</h2>
				<ol>
					<li>
						Return to your <b><i className="bi bi-cart"> </i>Cart </b>
						to try again.
					</li>
					<li>Try to place your order at a later time if the service is down temporarily for maintainence.</li>
					<li>Contact customer support and describe the issue or include a screenshot.</li>
				</ol>
			</div>
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

export function dbPost3(e, inputs, route) {
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