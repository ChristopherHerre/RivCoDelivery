import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Badge from '../cart/Badge';
import Logo from './Logo';
import Spinner from '../Spinner';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MuiBadge from '@mui/material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

import { Grid, Box, Button } from '@mui/material';
import ListIcon from '@mui/icons-material/List';

function Navbar(props) {
    const profile = props.profile;
    const setProfile = props.setProfile;
    const loginLoading = props.loginLoading;
    const setLoginLoading = props.setLoginLoading;
    const cartAmount = props.cartAmount;
    const address = props.address;
    const setAddress = props.setAddress;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;

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
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
              <Grid container alignItems="stretch" spacing={2}>
                {/* Left side: Logo and location */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, height: '100%' }}>
                    <Logo
                      profile={profile}
                      address={address}
                      setAddress={setAddress}
                      showGetLocation={showGetLocation}
                      setShowGetLocation={setShowGetLocation}
                    />
                  </Box>
                </Grid>
                {/* Right side: User info and buttons */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 2, height: '100%' }}>
                    {profile ? <ShowGoogleUserInfo profile={profile} /> : null}
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        {!profile ? (
                          <GoogleOAuthProvider clientId="21015588297-aj72ug866rm7j1nh7lsmffp986kbgoeh.apps.googleusercontent.com">
                            <GoogleLogin
                              onSuccess={handleGoogleLoginSuccess}
                              onFailure={handleGoogleLoginFailure}
                              useOneTap
                              render={(props) => (
                                <Button
                                  {...props}
                                  variant="contained"
                                  fullWidth
                                  sx={{
                                    bgcolor: '#616161',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#424242' },
                                  }}
                                  startIcon={<i className="bi bi-google google-icon"></i>}
                                >
                                  Sign in with Google
                                </Button>
                              )}
                            />
                          </GoogleOAuthProvider>
                        ) : (
                          <Link to="/user-orders" style={{ width: '100%' }}>
                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<ListIcon />}
                              sx={{
                                bgcolor: '#616161',
                                color: '#fff',
                                '&:hover': { bgcolor: '#424242' },
                              }}
                              type="button"
                            >
                              My Orders
                            </Button>
                          </Link>
                        )}
                        {profile && loginLoading ? <Spinner /> : null}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Link to="/cart" style={{ width: '100%' }}>
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{
                              bgcolor: '#616161',
                              color: '#fff',
                              '&:hover': { bgcolor: '#424242' },
                            }}
                          >
                            <MuiBadge badgeContent={cartAmount} color="error">
                              <ShoppingCartIcon />
                            </MuiBadge>
                            <span style={{ marginLeft: 10 }}>Cart</span>
                          </Button>
                        </Link>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
        </Box>
      );
      
}

export default Navbar;
