import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Badge from '../cart/Badge';
import Logo from './Logo';
import Spinner from '../Spinner';
import DeliveryAddress from '../address/DeliveryAddress';
import { Link } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

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
                <div className="mb-2">
                    <small className="flex items-center gap-2 flex-wrap">
                        <span>Welcome,</span>
                        <img className="google-profile-icon" src={profile.picture} alt={profile.name} /> 
                        <b>{profile.name}</b>
                        <a href="#" onClick={handleLogout}>Logout</a>
                    </small>
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
        <div id="navbar" className="flex flex-wrap lg:flex-nowrap items-center gap-4 mb-4 w-full">
            <div className="flex-none lg:min-w-[230px] lg:max-w-[260px]">
                <Logo />
            </div>
            <div className="w-full lg:flex-1 lg:max-w-[36%]">
                <div className="w-full mb-2">
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
                {profile && (
                    <div className="w-full flex">
                        <Link to={"/taxi"} className="w-full">
                            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full flex items-center justify-center gap-2 min-h-[52px]">
                                <i className="bi bi-taxi-front-fill"></i>
                                Taxi Ride
                            </button>
                        </Link>
                    </div>
                )}
            </div>
            <div className="w-full lg:flex-1 lg:max-w-[40%]">
                {profile ? <ShowGoogleUserInfo profile={profile} /> : ""}
                <div className="flex flex-col md:flex-row gap-2 w-full">
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        {
                            !profile ? 
                                <GoogleOAuthProvider className="w-full" clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                                    {/* Custom GoogleLogin Component */}
                                    <GoogleLogin
                                        className="w-full"
                                        onSuccess={handleGoogleLoginSuccess}
                                        onFailure={handleGoogleLoginFailure}
                                        useOneTap
                                        render={(props) => (
                                            <button
                                                {...props}
                                                className="google-login-btn bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full min-h-[52px]"
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
                            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full min-h-[52px]" type="button" onClick={() => navigate('/user-orders')}>
                                <i className="bi bi-list"></i> My Orders
                            </button> : ""
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <button 
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed" 
                            type="button" 
                            onClick={() => {
                                if (cart && cart.length > 0 && cart[0]?.restaurant_id) {
                                    navigate(`/${cart[0].restaurant_id}/cart`);
                                }
                            }}
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

export default Navbar;
