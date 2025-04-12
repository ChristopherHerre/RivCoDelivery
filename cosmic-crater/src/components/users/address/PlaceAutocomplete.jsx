import React, { useEffect, useRef } from 'react';
import axios from 'axios';

function PlaceAutocomplete({ onPlaceSelected, defaultValue = "" }) {
    const autocompleteRef = useRef(null);

    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) return;

            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${window.yourApiKey}&libraries=places,geometry&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        };

        if (!window.yourApiKey) {
            axios.get('/api/maps-api-key')
                .then(res => {
                    window.yourApiKey = res.data.apiKey;
                    loadGoogleMapsScript();
                });
        } else {
            loadGoogleMapsScript();
        }
    }, []);

    useEffect(() => {
        const el = autocompleteRef.current;
        if (!el) return;

        const onSelect = async ({ placePrediction }) => {
            try {
                const place = placePrediction.toPlace();
                await place.fetchFields({ fields: ['formattedAddress', 'location', 'addressComponents'] });

                const json = place.toJSON();
                const lat = json.location?.lat;
                const lng = json.location?.lng;

                const extractedAddress = extractAddress(json);

                if (lat !== undefined && lng !== undefined) {
                    onPlaceSelected({
                        address: extractedAddress,
                        latitude: lat,
                        longitude: lng,
                    });
                }
            } catch (err) {
                console.error("🔥 Error handling place select:", err);
            }
        };

        el.addEventListener('gmp-select', onSelect);
        return () => el.removeEventListener('gmp-select', onSelect);
    }, [autocompleteRef, onPlaceSelected]);

    const extractAddress = (placeJson) => {
        const address = {
            streetNumber: "",
            street: "",
            city: "",
            state: "",
            zip: "",
        };

        (placeJson.addressComponents || []).forEach(component => {
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

    return (
        <gmp-place-autocomplete
            ref={autocompleteRef}
            class="form-control mt-0 text-bg-dark rounded"
            placeholder="### Street"
            style={{ width: '100%' }}
        >
        </gmp-place-autocomplete>
    );
}

export default PlaceAutocomplete;
