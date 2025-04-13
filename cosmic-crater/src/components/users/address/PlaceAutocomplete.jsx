import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function PlaceAutocomplete({ onPlaceSelected, defaultValue = "" }) {
    const inputRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [autocompleteService, setAutocompleteService] = useState(null);
    const [placesService, setPlacesService] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                initializeServices();
                return;
            }
            const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
            if (existingScript) return;
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${window.yourApiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = initializeServices;
            document.head.appendChild(script);
        };
        const initializeServices = () => {
            const google = window.google;
            setAutocompleteService(new google.maps.places.AutocompleteService());
            setPlacesService(new google.maps.places.PlacesService(document.createElement("div")));
            setSessionToken(new google.maps.places.AutocompleteSessionToken());
        };
        if (!window.yourApiKey) {
            axios.get('/api/maps-api-key').then(res => {
                window.yourApiKey = res.data.apiKey;
                loadGoogleMapsScript();
            });
        } else {
            loadGoogleMapsScript();
        }
    }, []);
    const handleInputChange = (e) => {
        const value = e.target.value;
        if (value && autocompleteService && sessionToken) {
            autocompleteService.getPlacePredictions(
                {
                    input: value,
                    sessionToken: sessionToken,
                    componentRestrictions: { country: 'us' },
                },
                (predictions, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        setSuggestions(predictions);
                    } else {
                        setSuggestions([]);
                    }
                }
            );
        } else {
            setSuggestions([]);
        }
    };
    const handleSelect = (placeId) => {
        if (!placesService || !sessionToken) return;
        placesService.getDetails(
            {
                placeId,
                fields: ['formatted_address', 'geometry', 'address_components'],
                sessionToken: sessionToken,
            },
            (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const extractedAddress = extractAddress(place);
                    onPlaceSelected({
                        address: extractedAddress,
                        latitude: lat,
                        longitude: lng,
                    });
                    setSuggestions([]);
                    inputRef.current.value = place.formatted_address;
                    setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
                }
            }
        );
    };
    const extractAddress = (place) => {
        const address = {
            streetNumber: "",
            street: "",
            city: "",
            state: "",
            zip: "",
        };
        (place.address_components || []).forEach(component => {
            const types = component.types;
            const value = component.short_name;
            if (types.includes("street_number")) address.streetNumber = value;
            if (types.includes("route")) address.street = value;
            if (types.includes("locality")) address.city = value;
            if (types.includes("administrative_area_level_1")) address.state = value;
            if (types.includes("postal_code")) address.zip = value;
        });
        return address;
    };
    return (
        <div className="form-group position-relative">
            <input
                type="text"
                ref={inputRef}
                defaultValue={defaultValue}
                onChange={handleInputChange}
                className="form-control bg-dark text-white"
                placeholder="Enter address"
                autoComplete="off"
            />
            {suggestions.length > 0 && (
                <ul className="list-group position-absolute w-100 shadow-sm z-10" style={{ top: '100%', zIndex: 999 }}>
                    {suggestions.map((s) => (
                        <li
                            key={s.place_id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleSelect(s.place_id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {s.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
export default PlaceAutocomplete;
