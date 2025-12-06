import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Badge from '../cart/Badge';
import Logo from './Logo';
import Spinner from '../Spinner';
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
                <div>
                    <h6>Welcome, <img className="google-profile-icon" src={profile.picture} /> 
                        <b>{profile.name} </b>
                        <a href="#" onClick={handleLogout}>Logout</a>
                    </h6>
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
        <div id="navbar" className="flex flex-wrap">
            <Logo
                profile={profile}
                address={address}
                setAddress={setAddress}
                showGetLocation={showGetLocation}
                setShowGetLocation={setShowGetLocation}
            />
            <div className="w-full lg:w-1/2">
                {profile ? <ShowGoogleUserInfo profile={profile} /> : ""}
                <div className="flex flex-wrap">
                    <div className="w-full md:w-1/2">
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
                            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full mb-1" type="button" onClick={() => navigate('/user-orders')}>
                                <i className="bi bi-list"></i> My Orders
                            </button> : ""
                        }
                    </div>
                    <div className="w-full md:w-1/2">
                        <button 
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full mb-1 disabled:opacity-50 disabled:cursor-not-allowed" 
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
