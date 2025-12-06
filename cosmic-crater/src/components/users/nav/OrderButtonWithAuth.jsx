import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { MAX_RETRY_ATTEMPTS } from '../../App';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

function OrderButtonWithAuth({ restaurantId }) {
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

    // Add this useEffect to load Google Identity Services
    useEffect(() => {
        if (!window.google && !profile) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google && window.google.accounts) {
                    window.google.accounts.id.initialize({
                        client_id: '21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com',
                        callback: handleGoogleLoginSuccess,
                    });
                }
            };
            document.head.appendChild(script);
        }
    }, [profile]);

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
                
                // After login, navigate to SPA
                if (restaurantId) {
                    window.location.href = `/?restaurant=${restaurantId}&view=menu`;
                }
            } catch (err) {
                // Handle 429 errors
                if (err.response?.status === 429) {
                    const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Too many requests. Please wait a moment and try again.';
                    if (window.handle429Error) {
                        window.handle429Error(errorMsg);
                    }
                    setLoginLoading(false);
                    return; // Don't retry on 429
                }
                
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

    // Update handleButtonClick to trigger Google sign-in popup
    function handleButtonClick(e) {
        e.preventDefault();
        
        if (profile) {
            // User is logged in - verify session and navigate
            fetch('/api/session', {
                credentials: 'include'
            })
            .then(res => {
                if (res.status === 200) {
                    if (restaurantId) {
                        window.location.href = `/?restaurant=${restaurantId}&view=menu`;
                    }
                } else {
                    alert('You must be signed in to order from this restaurant.');
                }
            })
            .catch(err => {
                console.error('Error checking session:', err);
                alert('You must be signed in to order from this restaurant.');
            });
        } else {
            // User is not logged in - trigger Google sign-in
            setLoginLoading(true);
            if (window.google && window.google.accounts && window.google.accounts.id) {
                window.google.accounts.id.prompt();
            } else {
                // Fallback: show alert
                setLoginLoading(false);
                alert('Please sign in with Google using the button in the navbar.');
            }
        }
    }

    return (
        <div>
            {profile && <ShowGoogleUserInfo />}
            
            {/* Always show the Tailwind-styled button */}
            <button
                onClick={handleButtonClick}
                disabled={loginLoading}
                className="inline-block px-4 py-2 bg-blue-600 text-white font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer border-0"
                style={{
                    opacity: loginLoading ? 0.6 : 1,
                    cursor: loginLoading ? 'wait' : 'pointer'
                }}
            >
                {loginLoading ? 'Signing in...' : 'Order from this restaurant'}
            </button>
        </div>
    );
}

export default OrderButtonWithAuth;

