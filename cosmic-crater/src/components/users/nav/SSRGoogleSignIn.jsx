import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { MAX_RETRY_ATTEMPTS } from '../../App';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

function SSRGoogleSignIn() {
    const [profile, setProfile] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);

    // Load profile from localStorage on mount
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

    // Listen for profile changes from other components
    useEffect(() => {
        const handleProfileChange = () => {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            } else {
                setProfile(null);
            }
        };
        window.addEventListener('profile-changed', handleProfileChange);
        return () => window.removeEventListener('profile-changed', handleProfileChange);
    }, []);

    function ShowGoogleUserInfo() {
        return (
            profile && (
                <div className="mb-3">
                    <h6 className="mb-2">
                        Welcome, <img className="google-profile-icon" src={profile.picture} alt={profile.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc', verticalAlign: 'middle', marginRight: '4px' }} /> 
                        <b>{profile.name} </b>
                        <a href="#" onClick={handleLogout} style={{ marginLeft: '8px', color: '#666', textDecoration: 'underline' }}>Logout</a>
                    </h6>
                </div>
            )
        );
    }

    async function handleGoogleLoginSuccess(response) {
        console.log('Login Successful', response);
        setLoginLoading(true);
        const login = async (attempt = 1) => {
            try {
                const res = await axios.post('/api/google-login', {
                    token: response.credential
                }, { withCredentials: true });        
                console.log('Backend response:', res.data);
                setProfile(res.data);
                localStorage.setItem('profile', JSON.stringify(res.data));
                setLoginLoading(false);
                
                // Dispatch custom event to notify SSR pages to show SPA
                window.dispatchEvent(new Event('profile-changed'));
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    console.error('Error verifying token, retrying...', err);
                    login(attempt + 1);
                } else {
                    console.error('Error verifying token after multiple attempts:', err);
                    setLoginLoading(false);
                }
            }
        };
        login().catch(error => {
            console.error('Error in login:', error);
            setLoginLoading(false);
        });
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
                // Dispatch event to update other components
                window.dispatchEvent(new Event('profile-changed'));
            } catch (err) {
                console.error('Error logging out:', err);
            }
        };
        logout().catch(error => console.error('Error in logout:', error));
    }

    return (
        <div className="mb-3">
            {profile ? (
                <ShowGoogleUserInfo />
            ) : (
                <div>
                    {loginLoading ? (
                        <div className="mb-2">Loading...</div>
                    ) : (
                        <GoogleOAuthProvider clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                            <GoogleLogin
                                onSuccess={handleGoogleLoginSuccess}
                                onFailure={handleGoogleLoginFailure}
                                useOneTap
                                render={(props) => (
                                    <button
                                        {...props}
                                        className="google-login-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full mb-1 flex items-center justify-center gap-2"
                                    >
                                        <i className="bi bi-google google-icon"></i> Sign in with Google
                                    </button>
                                )}
                            />
                        </GoogleOAuthProvider>
                    )}
                </div>
            )}
        </div>
    );
}

export default SSRGoogleSignIn;

