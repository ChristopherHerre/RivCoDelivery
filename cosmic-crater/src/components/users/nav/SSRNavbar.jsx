import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import Badge from '../cart/Badge';
import Spinner from '../Spinner';
import DeliveryAddress from '../address/DeliveryAddress';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

function SSRNavbar() {
    const [profile, setProfile] = useState(null);
    const [cart, setCart] = useState([]);
    const [cartAmount, setCartAmount] = useState(0);
    const [loginLoading, setLoginLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [showGetLocation, setShowGetLocation] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);

    // Load profile from localStorage on mount
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

    // Load cart when profile changes
    useEffect(() => {
        const loadCart = async () => {
            if (profile?.sub) {
                try {
                    const response = await axios.get('/api/cart', {
                        withCredentials: true
                    });
                    if (response.data && Array.isArray(response.data)) {
                        setCart(response.data);
                    }
                } catch (error) {
                    console.error('Error loading cart:', error);
                } finally {
                    setCartLoading(false);
                }
            } else {
                setCart([]);
                setCartLoading(false);
            }
        };
        loadCart();
    }, [profile]);

    // Calculate cart amount
    useEffect(() => {
        let ca = 0;
        for (const item of cart) {
            ca += item.quantity || 0;
        }
        setCartAmount(ca);
    }, [cart]);

    // Load address when profile changes
    useEffect(() => {
        const loadAddress = async () => {
            if (profile?.sub) {
                try {
                    const res = await axios.get('/api/user/address', {
                        withCredentials: true
                    });
                    setAddress(res.data.address);
                    if (res.data.address && res.data.address.streetNumber) {
                        setShowGetLocation(false);
                    } else {
                        setShowGetLocation(true);
                    }
                } catch (err) {
                    console.error('Error fetching address:', err);
                }
            }
        };
        loadAddress();
    }, [profile]);

    function ShowGoogleUserInfo() {
        return (
            profile && (
                <div className="flex items-center gap-2 flex-wrap text-sm md:text-base">
                    <span>Welcome,</span>
                    <img className="google-profile-icon" src={profile.picture} alt={profile.name} /> 
                    <b>{profile.name}</b>
                    <a href="#" onClick={handleLogout}>Logout</a>
                </div>
            )
        );
    }

    async function handleGoogleLoginSuccess(response) {
        console.log('Login Successful', response);
        setLoginLoading(true);
        try {
            const res = await axios.post('/api/google-login', {
                token: response.credential
            }, { withCredentials: true });        
            console.log('Backend response:', res.data);
            setProfile(res.data);
            localStorage.setItem('profile', JSON.stringify(res.data));
            setLoginLoading(false);
            setShowGetLocation(true);
            
            // Dispatch custom event to notify SSR pages to show SPA
            window.dispatchEvent(new Event('profile-changed'));
        } catch (err) {
            console.error('Error verifying token:', err);
            setLoginLoading(false);
        }
    }

    function handleGoogleLoginFailure(error) {
        console.error('Login Failed:', error);
    }

    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('profile');
        googleLogout();
        const logout = async () => {
            try {
                const response = await axios.get(`/api/logout`, { withCredentials: true });
                console.log(response.data.message);
                setProfile(null);
                window.location.href = '/';
            } catch (err) {
                console.error('Error logging out:', err);
            }
        };
        logout().catch(error => console.error('Error in logout:', error));
    }

    function handleCartClick() {
        if (cart && cart.length > 0 && cart[0]?.restaurant_id) {
            // Need to get restaurant data to build URL
            axios.get(`/api/public/restaurants/${cart[0].restaurant_id}`)
                .then(res => {
                    const restaurant = res.data;
                    if (restaurant && restaurant.city_slug) {
                        const slug = restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        window.location.href = `/restaurants/${restaurant.city_slug}/${restaurant.id}-${slug}/cart`;
                    } else {
                        // Fallback to old format
                        window.location.href = `/${cart[0].restaurant_id}/cart`;
                    }
                })
                .catch(err => {
                    console.error('Error fetching restaurant:', err);
                    // Fallback to old format
                    window.location.href = `/${cart[0].restaurant_id}/cart`;
                });
        }
    }

    function handleMyOrdersClick() {
        window.location.href = '/user-orders';
    }

    return (
        <div id="navbar" className="flex flex-wrap">
            <div className="w-full lg:w-1/2">
                <a href="/">
                    <button 
                        className="removebutton align-text-bottom" 
                        type="button">
                        <span className="logofont2">RivCo</span>
                        <span className="logofont">DELIVERY</span>
                    </button>
                </a>
                <div className="w-full">
                    {profile ? <DeliveryAddress 
                        showGetLocation={showGetLocation} 
                        setShowGetLocation={setShowGetLocation} 
                        address={address} 
                        setAddress={setAddress}
                    /> : 
                    <div>
                        <label>
                            <u className="text-red-600">
                                You must sign in to place an order!
                            </u>
                        </label>
                    </div>}
                </div>
            </div>
            <div className="w-full lg:w-1/2">
                {profile ? <ShowGoogleUserInfo /> : ""}
                <div className="flex flex-wrap">
                    <div className="w-full md:w-1/2">
                        {
                            !profile ? 
                                <GoogleOAuthProvider clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                                    <GoogleLogin
                                        onSuccess={handleGoogleLoginSuccess}
                                        onFailure={handleGoogleLoginFailure}
                                        useOneTap
                                        render={(props) => (
                                            <button
                                                {...props}
                                                className="google-login-btn bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full mb-1"
                                            >
                                                <i className="bi bi-google google-icon"></i> Sign in with Google
                                            </button>
                                        )}
                                    />
                                </GoogleOAuthProvider>
                            : ""
                        }
                        {profile && loginLoading ? <Spinner /> : ""}
                        {profile ? 
                            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full mb-1" type="button" onClick={handleMyOrdersClick}>
                                <i className="bi bi-list"></i> My Orders
                            </button> : ""
                        }
                    </div>
                    <div className="w-full md:w-1/2">
                        <button 
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full mb-1 disabled:opacity-50 disabled:cursor-not-allowed" 
                            type="button" 
                            onClick={handleCartClick}
                            disabled={!cart || cart.length === 0 || !cart[0]?.restaurant_id}
                        >
                            <i className="bi bi-cart"> </i>
                            <span className="inline-block">
                                Cart
                                <Badge cartAmount={cartAmount} />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SSRNavbar;

