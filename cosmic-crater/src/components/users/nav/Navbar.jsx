import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Badge from '../cart/Badge';
import Spinner from '../Spinner';
import DeliveryAddress from '../address/DeliveryAddress';
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ResponsiveFlexRow from '../../common/ResponsiveFlexRow';
import Button from '../../common/Button';

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
        const { profile } = props;
        return (
            profile && (
                <div className="flex items-center gap-2 flex-wrap text-sm md:text-base">
                    <span className="text-base-content font-semibold">Welcome,</span>
                    <div className="avatar">
                        <div className="w-8 h-8 rounded-full">
                            <img src={profile.picture} alt={profile.name} /> 
                        </div>
                    </div>
                    <b className="text-base-content font-semibold">{profile.name}</b>
                    <button className="btn btn-link btn-sm text-error" onClick={handleLogout}>Logout</button>
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

    return (
        <>
            <div id="navbar" className="navbar p-4 mb-4 w-full">
                <div className="navbar-start w-full xl:flex-1">
                    {profile ? (
                        <div className="flex flex-row md:flex-row lg:flex-row max-[480px]:flex-col items-center gap-4 mb-2">
                            <ShowGoogleUserInfo profile={profile} />
                            <DeliveryAddress 
                                showGetLocation={showGetLocation} 
                                setShowGetLocation={setShowGetLocation} 
                                address={address} 
                                setAddress={setAddress}
                            />
                        </div>
                    ) : (
                        <div className="alert alert-warning shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>You must sign in to place an order!</span>
                        </div>
                    )}
                </div>
                <div className="navbar-end w-full xl:flex-1">
                    {!profile ? (
                        <GoogleOAuthProvider className="w-full" clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                            <GoogleLogin
                                className="w-full"
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
                                        className="whitespace-nowrap"
                                    >
                                        <i className="bi bi-google"></i> Sign in with Google
                                    </Button>
                                )}
                            />
                        </GoogleOAuthProvider>
                    ) : (
                        <>
                            {profile && loginLoading ? <Spinner /> : ""}
                            {profile && (
                                <div className="flex flex-row md:flex-row lg:flex-row xl:flex-row max-[400px]:flex-col items-center gap-3">
                                    <Button 
                                        variant="secondary"
                                        size="md"
                                        fullWidth
                                        type="button" 
                                        className="flex-1 max-[400px]:w-full whitespace-nowrap"
                                        onClick={() => navigate('/user-orders')}
                                    >
                                        <i className="bi bi-list"></i> My Orders
                                    </Button>
                                    <Button 
                                        variant="secondary"
                                        size="md"
                                        fullWidth
                                        type="button" 
                                        className="flex-1 max-[400px]:w-full whitespace-nowrap"
                                        onClick={() => {
                                            if (cart && cart.length > 0 && cart[0]?.restaurant_id) {
                                                navigate(`/${cart[0].restaurant_id}/cart`);
                                            }
                                        }}
                                        disabled={!cart || cart.length === 0 || !cart[0]?.restaurant_id}
                                    >
                                        <i className="bi bi-cart"></i>
                                        <span className="inline-block">
                                            Cart
                                            <Badge cartAmount={cartAmount} />
                                        </span>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// Memoize Navbar to prevent unnecessary re-renders when props haven't changed
// This is especially important since it contains GoogleOAuthProvider which can be expensive to re-render
export default React.memo(Navbar);
