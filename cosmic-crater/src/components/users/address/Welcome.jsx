import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import DeliveryAddress from './DeliveryAddress';
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
        const initMap = async () => {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${yourApiKey}&libraries=places,geometry&v=beta&loading=async`;
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
                    initMap().then(() => {
                        setLoadingApiKey(false);
                    });
                });
        }
    }, [showGetLocation]);

    useEffect(() => {
        const autocompleteEl = autocompleteRef.current;
    
        if (!autocompleteEl) return;
    
        const onSelect = async ({ placePrediction }) => {
            try {
                console.log("🧠 Prediction selected:", placePrediction);
    
                const place = placePrediction.toPlace();
                await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
                });
    
                const json = place.toJSON();
                console.log("📍 Full Place JSON:", json);
    
                const lat = json.location.lat;
                const lng = json.location.lng;

    
                console.log("📌 Latitude:", lat);
                console.log("📌 Longitude:", lng);
    
                const extractedAddress = extractAddress(json);
                console.log("📬 Extracted Address Object:", extractedAddress);
    
                if (!lat || !lng || !extractedAddress) {
                    console.error("❌ Missing lat/lng or extractedAddress — NOT sending to server.");
                    return;
                }
    
                const payload = {
                    address: extractedAddress,
                    latitude: lat,
                    longitude: lng
                };
    
                console.log("🚀 Sending to backend:", payload);
                console.log("📍 Full Place JSON:", json);
                console.log("📍 Raw location object:", json.location);
                console.log("📍 typeof lat:", typeof json.location.lat);
                console.log("📍 typeof lng:", typeof json.location.lng);
                axios.post('/api/user/address', payload, { withCredentials: true })
                    .then(() => {
                        console.log("✅ Address saved successfully.");
                        setAddress(extractedAddress);
                        setShowGetLocation(false);
                    })
                    .catch(err => {
                        console.error("❌ Error saving address:", err);
                    });
            } catch (err) {
                console.error("🔥 Error inside gmp-select handler:", err);
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
                    <gmp-place-autocomplete
                        ref={autocompleteRef}
                        class="form-control mt-0 text-bg-dark rounded"
                        placeholder="### Street"
                        style={{ width: '100%' }}
                    ></gmp-place-autocomplete>
                </div>
            </div>
        </div>
    ) : null;
}

export default Welcome;
