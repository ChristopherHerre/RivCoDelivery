import React from 'react';
import axios from 'axios';
import DeliveryAddress from './DeliveryAddress';
import PlaceAutocomplete from './PlaceAutocomplete';

function Welcome(props) {
    const {
        address,
        setAddress,
        showGetLocation,
        setShowGetLocation,
    } = props;

    return showGetLocation ? (
        <div className="row search p-5">
            <h2>Welcome to Riverside County Delivery!</h2>
            <h1>We deliver items and we provide rides <mark>locally</mark>.</h1>
            <br />
            <div className="row">
                <div className="col-12">
                    <DeliveryAddress
                        showGetLocation={showGetLocation}
                        setShowGetLocation={setShowGetLocation}
                        address={address}
                        setAddress={setAddress}
                    />
                    <PlaceAutocomplete
                        onPlaceSelected={async ({ address, latitude, longitude }) => {
                            await axios.post('/api/user/address', {
                                address,
                                latitude,
                                longitude
                            }, { withCredentials: true });

                            console.log("✅ Address saved");
                            setAddress(address);
                            setShowGetLocation(false);
                        }}
                    />
                </div>
            </div>
        </div>
    ) : null;
}

export default Welcome;
