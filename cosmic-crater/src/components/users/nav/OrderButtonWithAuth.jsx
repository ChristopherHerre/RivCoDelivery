import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Button from '../../common/Button';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

function OrderButtonWithAuth({ restaurantId }) {
    const [profile, setProfile] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);

    // Load profile from localStorage on mount and verify session
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            // Verify session is still valid
            fetch('/api/session', {
                credentials: 'include'
            })
            .then(res => {
                if (res.status === 200) {
                    // Session is valid, use stored profile
                    setProfile(JSON.parse(storedProfile));
                } else {
                    // Session is invalid, clear profile
                    localStorage.removeItem('profile');
                    setProfile(null);
                }
            })
            .catch(err => {
                console.error('Error checking session:', err);
                // On error, clear profile to be safe
                localStorage.removeItem('profile');
                setProfile(null);
            });
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
                // Don't change the URL - preserve the current page so user stays where they are
                window.dispatchEvent(new Event('profile-changed'));
                
                // Note: We don't navigate here - the SPA will mount on the current page
                // This ensures users stay on menu item pages after login
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

    function handleGoogleLoginFailure(error) {
        console.error('Login Failed:', error);
        setLoginLoading(false);
    }

    // Update handleButtonClick to verify session if logged in
    function handleButtonClick(e) {
        e.preventDefault();
        
        if (profile) {
            // User is logged in - verify session
            fetch('/api/session', {
                credentials: 'include'
            })
            .then(res => {
                if (res.status === 200) {
                    // User is already logged in and on a valid page - don't navigate
                    // The SPA should already be showing, or will show after profile-changed event
                    // This preserves the current URL (e.g., menu item pages)
                } else {
                    alert('You must be signed in to order from this restaurant.');
                }
            })
            .catch(err => {
                console.error('Error checking session:', err);
                alert('You must be signed in to order from this restaurant.');
            });
        }
        // If not logged in, the GoogleLogin component will handle sign-in
    }

    return (
        <div>
            {profile ? (
                // User is logged in - show order button
                <Button
                    onClick={handleButtonClick}
                    size="lg"
                    responsiveFullWidth
                >
                    Order from this restaurant
                </Button>
            ) : (
                // User is not logged in - use GoogleLogin component (same as SPA)
                <GoogleOAuthProvider className="w-full" clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                    <GoogleLogin
                        className="w-full"
                        onSuccess={handleGoogleLoginSuccess}
                        onFailure={handleGoogleLoginFailure}
                        useOneTap
                        render={(renderProps) => (
                            <Button
                                {...renderProps}
                                variant="secondary"
                                size="sm"
                                fullWidth
                                disabled={renderProps.disabled || loginLoading}
                                loading={loginLoading}
                                className="google-login-btn"
                            >
                                <i className="bi bi-google google-icon"></i> {loginLoading ? 'Signing in...' : 'Sign in with Google'}
                            </Button>
                        )}
                    />
                </GoogleOAuthProvider>
            )}
        </div>
    );
}

export default OrderButtonWithAuth;
