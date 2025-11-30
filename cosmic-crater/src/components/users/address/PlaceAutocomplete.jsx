import React, { useRef, useState, useCallback } from 'react';
import axios from 'axios';

// Generate a session token for billing optimization
function generateSessionToken() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function PlaceAutocomplete({ onPlaceSelected, defaultValue = "", placeholder = "Enter address" }) {
    const inputRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [sessionToken, setSessionToken] = useState(generateSessionToken());
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = useCallback(async (e) => {
        const value = e.target.value;
        if (!value || value.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get('/places/autocomplete', {
                params: {
                    input: value,
                    sessionToken: sessionToken,
                    country: 'us',
                },
            });

            if (response.data.status === 'OK' && response.data.predictions) {
                setSuggestions(response.data.predictions);
            } else {
                // Log non-OK responses for debugging
                if (response.data.status !== 'ZERO_RESULTS') {
                    console.error('[PlaceAutocomplete] Non-OK response status:', {
                        status: response.data.status,
                        error_message: response.data.error_message,
                        input: value.substring(0, 50),
                    });
                }
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [sessionToken]);

    const handleSelect = useCallback(async (placeId) => {
        if (!placeId) return;

        try {
            const response = await axios.get('/places/details', {
                params: {
                    placeId: placeId,
                    sessionToken: sessionToken,
                    fields: 'formatted_address,geometry,address_components',
                },
            });

            if (response.data.status === 'OK' && response.data.result) {
                const place = response.data.result;
                const lat = place.geometry?.location?.lat;
                const lng = place.geometry?.location?.lng;
                
                if (lat !== undefined && lng !== undefined) {
                    const extractedAddress = extractAddress(place);
                    onPlaceSelected({
                        address: extractedAddress,
                        latitude: lat,
                        longitude: lng,
                    });
                    setSuggestions([]);
                    if (inputRef.current) {
                        inputRef.current.value = place.formatted_address || '';
                    }
                    // Generate new session token for next autocomplete session
                    setSessionToken(generateSessionToken());
                }
            } else {
                // Log non-OK responses for place details
                console.error('[PlaceAutocomplete] Place details non-OK response:', {
                    status: response.data.status,
                    error_message: response.data.error_message,
                    placeId: placeId ? placeId.substring(0, 50) : 'undefined',
                });
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        }
    }, [sessionToken, onPlaceSelected]);
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
                placeholder={placeholder}
                autoComplete="off"
                required
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