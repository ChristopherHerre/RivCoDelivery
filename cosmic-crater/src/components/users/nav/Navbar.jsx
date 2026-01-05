import React, { useState, useRef, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Badge from '../cart/Badge';
import Spinner from '../Spinner';
import DeliveryAddress from '../address/DeliveryAddress';
import NavbarSkeleton from '../../common/NavbarSkeleton';
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ResponsiveFlexRow from '../../common/ResponsiveFlexRow';
import Button from '../../common/Button';
import BreadcrumbWrapper from '../../common/BreadcrumbWrapper';

function Navbar(props) {
    const cart = props.cart;
    const profile = props.profile;
    const setProfile = props.setProfile;
    const loginLoading = props.loginLoading;
    const setLoginLoading = props.setLoginLoading;
    const cartAmount = props.cartAmount;
    const address = props.address;
    const setAddress = props.setAddress;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const navigate = useNavigate();

    function ShowGoogleUserInfo(props) {
        const { profile, onLogout } = props;
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const dropdownRef = useRef(null);

        // Close dropdown when clicking outside (but not when clicking the button itself)
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setDropdownOpen(false);
                }
            };

            if (dropdownOpen) {
                // Use click instead of mousedown and add a small delay to let button click toggle first
                const timeoutId = setTimeout(() => {
                    document.addEventListener('click', handleClickOutside);
                }, 100);
                return () => {
                    clearTimeout(timeoutId);
                    document.removeEventListener('click', handleClickOutside);
                };
            }
        }, [dropdownOpen]);

        return (
            profile && (
                <div className={`dropdown dropdown-end ${dropdownOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
                        <Button
                            variant="primary"
                            size="md"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(!dropdownOpen);
                            }}
                            className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm md:text-base max-[320px]:!px-2 max-[320px]:!py-1 max-[320px]:!text-xs"
                            aria-label={`User menu for ${profile.name}`}
                            aria-expanded={dropdownOpen}
                        >
                        <div className="avatar">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                                <img src={profile.picture} alt={profile.name} /> 
                            </div>
                        </div>
                        <i className={`bi bi-chevron-down transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                    </Button>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-primary text-primary-content rounded-box z-[200] w-52 p-2 shadow-lg border border-primary mt-2"
                    >
                        <li>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLogout(e);
                                    setDropdownOpen(false);
                                }}
                                className="text-error hover:bg-error hover:text-error-content focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-primary"
                            >
                                <i className="bi bi-box-arrow-right"></i>
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            )
        );
    }

    async function handleGoogleLoginSuccess(response) {
        console.log('Login Successful', response);
        const login = async (attempt = 1) => {
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

    // Show skeleton during login loading
    if (loginLoading) {
        return <NavbarSkeleton />;
    }

    return (
        <>
            <div id="navbar" className="card bg-base-100 shadow-md mb-4 w-full sticky top-0 z-50">
                <div className="card-body p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Left Section - User Info / Sign In Message */}
                        <div className="w-full lg:flex-1">
                            {profile ? (
                                <div className="flex flex-row flex-wrap min-[380px]:flex-nowrap items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <DeliveryAddress 
                                            showGetLocation={showGetLocation} 
                                            setShowGetLocation={setShowGetLocation} 
                                            address={address} 
                                            setAddress={setAddress}
                                        />
                                    </div>
                                    <div className="ml-auto lg:ml-0 w-full min-[380px]:w-auto flex justify-center min-[380px]:justify-start">
                                        <ShowGoogleUserInfo profile={profile} onLogout={handleLogout} />
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-base-content">You must sign in to place an order!</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Right Section - Actions */}
                        <div className="w-full lg:flex-1 lg:flex lg:justify-end">
                            {!profile ? (
                                <GoogleOAuthProvider className="w-full lg:w-auto" clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                                    <GoogleLogin
                                        className="w-full lg:w-auto"
                                        onSuccess={handleGoogleLoginSuccess}
                                        onFailure={handleGoogleLoginFailure}
                                        useOneTap
                                        render={(props) => (
                                            <Button
                                                {...props}
                                                variant="secondary"
                                                size="md"
                                                fullWidth
                                                type="button"
                                                className="whitespace-nowrap max-[320px]:!px-2 max-[320px]:!py-1 max-[320px]:!text-sm"
                                            >
                                                <i className="bi bi-google"></i> Sign in with Google
                                            </Button>
                                        )}
                                    />
                                </GoogleOAuthProvider>
                            ) : (
                                <>
                                    {profile && (
                                        <div className="flex flex-row md:flex-row gap-3 w-full lg:w-auto min-w-0">
                                            <Button 
                                                variant="secondary"
                                                size="md"
                                                type="button" 
                                                className="flex-1 lg:flex-none whitespace-nowrap min-w-0 max-[320px]:!px-2 max-[320px]:!py-1 max-[320px]:!text-sm"
                                                onClick={() => navigate('/user-orders')}
                                            >
                                                <i className="bi bi-list"></i> My Orders
                                            </Button>
                                            <Button 
                                                variant="secondary"
                                                size="md"
                                                type="button" 
                                                className="flex-1 lg:flex-none whitespace-nowrap min-w-0 overflow-visible relative max-[320px]:!px-2 max-[320px]:!py-1 max-[320px]:!text-sm"
                                                onClick={() => {
                                                    if (cart && cart.length > 0 && cart[0]?.restaurant_id) {
                                                        navigate(`/${cart[0].restaurant_id}/cart`);
                                                    }
                                                }}
                                                disabled={!cart || cart.length === 0 || !cart[0]?.restaurant_id}
                                            >
                                                <span className="inline-flex items-center">
                                                    <i className="bi bi-cart"></i>
                                                    <span className="ml-1">Cart</span>
                                                </span>
                                                <Badge cartAmount={cartAmount} />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {/* Breadcrumbs */}
                    <div className="mt-4">
                        <BreadcrumbWrapper />
                    </div>
                </div>
            </div>
        </>
    );
}

// Memoize Navbar to prevent unnecessary re-renders when props haven't changed
// This is especially important since it contains GoogleOAuthProvider which can be expensive to re-render
export default React.memo(Navbar);
