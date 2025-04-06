import { Link } from 'react-router-dom';
import DeliveryAddress from './DeliveryAddress';

function Logo(props) {
    const profile = props.profile;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const address = props.address;
    const setAddress = props.setAddress;
    return (
        <div className="col-12 col-lg-6">
            <Link to="/">
                <button 
                        className="removebutton align-text-bottom" 
                        type="button">
                    <span className="logofont2">RivCo</span>
                    <span className="logofont">DELIVERY</span>
                </button>
            </Link>
            <div className="col-12">
                {profile ? <DeliveryAddress 
                    showGetLocation={showGetLocation} 
                    setShowGetLocation={setShowGetLocation} 
                    address={address} 
                    setAddress={setAddress}
                /> : 
                <div>
                    <label>
                        <u className="text-danger">
                            You must sign in to place an order!
                        </u>
                    </label>
                </div>}
            </div>
        </div>
    );
}
export default Logo;