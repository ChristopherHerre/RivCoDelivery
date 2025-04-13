import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import DeliveryAddress from './DeliveryAddress';
import PlaceAutocomplete from './PlaceAutocomplete';

function Welcome(props) {
    const {
        address,
        setAddress,
        showGetLocation,
        setShowGetLocation,
        setLoadingApiKey,
    } = props;

    const autocompleteRef = useRef(null);
    const selectedPlaceRef = useRef(null);

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
                return;
            }
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${window.yourApiKey}&libraries=places,geometry&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        };
        if (showGetLocation) {
            setLoadingApiKey(true);
            axios.get('/api/maps-api-key')
            .then(res => {
                const apiKey = res.data.apiKey;
                window.yourApiKey = apiKey;
                loadGoogleMapsScript();
                setLoadingApiKey(false);
            });
        }
    }, [showGetLocation]);
    
    useEffect(() => {
        const autocompleteEl = autocompleteRef.current;
        if (!autocompleteEl) return;
        const onSelect = async ({ placePrediction }) => {
            try {
                if (!placePrediction) {
                    console.warn("No placePrediction provided.");
                    return;
                }
                const place = placePrediction.toPlace();
                await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] });
                const json = place.toJSON();
                console.log("📍 Full Place JSON:", json);
                const lat = json.location?.lat;
                const lng = json.location?.lng;
                console.log("📌 Latitude:", lat);
                console.log("📌 Longitude:", lng);
                const extractedAddress = extractAddress(json);
                console.log("📬 Extracted Address:", extractedAddress);
                if (lat !== undefined && lng !== undefined && extractedAddress) {
                    await axios.post('/api/user/address', {
                        address: extractedAddress,
                        latitude: lat,
                        longitude: lng
                    }, { withCredentials: true });
                    console.log("✅ Address saved");
                    setAddress(extractedAddress);
                    setShowGetLocation(false);
                } else {
                    console.warn("❌ Incomplete address data, skipping save.");
                }
            } catch (err) {
                console.error("🔥 Error in gmp-select handler:", err);
            }
        };
        autocompleteEl.addEventListener('gmp-select', onSelect);
        return () => {
            autocompleteEl.removeEventListener('gmp-select', onSelect);
        };
    }, [autocompleteRef.current]);

    const extractAddress = (placeJson) => {
        const address = {
            streetNumber: "",
            street: "",
            city: "",
            state: "",
            zip: "",
        };
        const components = placeJson.addressComponents || [];
        components.forEach(component => {
            const types = component.types;
            const value = component.shortText;
            if (types.includes("street_number")) address.streetNumber = value;
            if (types.includes("route")) address.street = value;
            if (types.includes("locality")) address.city = value;
            if (types.includes("administrative_area_level_1")) address.state = value;
            if (types.includes("postal_code")) address.zip = value;
        });
        return address;
    };

    return showGetLocation ? (
        <div className="row search p-5">
            <h2>Welcome to Riverside County Delivery!</h2>
            <h1>We deliver items and we provide rides locally.</h1>
            <br />
            <div className="row">
                <div className="col-lg-8">
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
