import { Link } from 'react-router-dom';
import DeliveryAddress from '../address/DeliveryAddress';
import { Box, Button, Typography } from '@mui/material';

function Logo(props) {
    const { profile, showGetLocation, setShowGetLocation, address, setAddress } = props;
    return (
        <Box sx={{ width: '100%' }}>
            <Link to="/">
                <button 
                        className="removebutton align-text-bottom" 
                        type="button">
                    <span className="logofont2">RivCo</span>
                    <span className="logofont">DELIVERY</span>
                </button>
            </Link>
            <Box sx={{ width: '100%', mt: 1 }}>
                {profile ? (
                    <DeliveryAddress
                        showGetLocation={showGetLocation}
                        setShowGetLocation={setShowGetLocation}
                        address={address}
                        setAddress={setAddress}
                    />
                ) : (
                    <Typography color="error" variant="body2" sx={{ textDecoration: 'underline' }}>
                        You must sign in to place an order!
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
export default Logo;
