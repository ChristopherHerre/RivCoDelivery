import DeliveryAddress from './DeliveryAddress';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from './Spinner';

const mapApiJs = 'https://maps.googleapis.com/maps/api/js';

function Welcome(props) {
    const address = props.address;
    const setAddress = props.setAddress;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const searchInput = useRef(null);
    const [apiKey, setApiKey] = useState('');
    const setLoadingApiKey = props.setLoadingApiKey;
    useEffect(() => {
        const fetchApiKey = async (attempt = 1) => {
            setLoadingApiKey(true);
            try {
                const res = await axios.get('/api/maps-api-key')
                .then((res) => {
                    setApiKey(res.data.apiKey);
                    console.log("API KEY IS SET! " + apiKey);
                })
                .then(() => {
                    setLoadingApiKey(false);
                    console.log('API Key is set, initializing map script in Welcome...');
                    initMapScript().then(() => {
                        console.log('Map script loaded in Welcome, initializing autocomplete...');
                        initAutocomplete();
                    }).catch(error => {
                        console.error('Error loading map script in Welcome:', error);
                    });
                });
                
            } catch (error) {
                console.error('Error fetching API key:', error);
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchApiKey(attempt + 1);
                }
            }
        };
        if (showGetLocation) {
            console.log("showGetLocation is true, fetching API key...");
            fetchApiKey();
        } else {
            console.log("showGetLocation is false, not fetching API key.");
        }
    }, [showGetLocation]);
    async function initMapScript() {
        console.log('initMapScript called');
        const scriptId = 'google-maps-script';
        if (document.getElementById(scriptId)) {
            console.log('Google Maps script already loaded.');
            return Promise.resolve();
        }
        const src = `${mapApiJs}?key=${apiKey}&libraries=places,geometry`;
        console.log('Loading script with src:', src);
        return loadAsyncScript(src);
    }
    
    async function loadAsyncScript(src) {
        console.log("Calling loadAsyncScript with src:", src);
        return new Promise(resolve => {
            const script = document.createElement("script");
            Object.assign(script, {
                type: "text/javascript",
                async: true,
                defer: true,
                src
            });
            script.addEventListener("load", () => {
                console.log("Script loaded:", src);
                resolve(script);
            });
            script.addEventListener("error", () => {
                console.error("Error loading script:", src);
            });
            document.head.appendChild(script);
            console.log("Appended script:", src);
        });
    }
    
    const initAutocomplete = () => {
        if (!searchInput.current) return;
        if (!window.google || !window.google.maps) {
            console.error("Google Maps script not loaded yet.");
            return;
        }
        const autocomplete = new window.google.maps.places.Autocomplete(searchInput.current);
        const southwest = { lat: 33.833322851100824, lng: -117.46334029886367 };
        const northeast = { lat: 34.02489224499665, lng: -117.3135582245764 };
        const newBounds = new window.google.maps.LatLngBounds(southwest, northeast);
        autocomplete.setBounds(newBounds);
        autocomplete.setFields(["address_component", "geometry"]);
        autocomplete.addListener("place_changed", () => onChangeAddress(autocomplete));
    };
    
    function resetAddressWarning(e) {
        return e.target.value.length == 0 ? setShowGetLocation(true) : "";
    }
    
    const onChangeAddress = (autocomplete) => {
        const place = autocomplete.getPlace();
        if (place) {
            const address = extractAddress(place);
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            axios.post(`/api/user/address`, 
                { 
                    address,
                    latitude: lat,
                    longitude: lng 
                }, 
                { withCredentials: true }
            ).then(() => {
                setAddress(address);
                setLatitude(lat);
                setLongitude(lng);
                setShowGetLocation(false);
            }).catch(err => console.error('Error saving address:', err));
        }
    };
    
    const extractAddress = (place) => {
        const address = {
            streetNumber: "",
            street: "",
            city: "",
            state: "",
            zip: "",
        };
        if (!Array.isArray(place?.address_components)) {
            return address;
        }
        place.address_components.forEach(component => {
            const types = component.types;
            const value = component.short_name;
            if (types.includes("street_number")) {
                address.streetNumber = value;
            }
            if (types.includes("route")) {
                address.street = value;
            }
            if (types.includes("locality")) {
                address.city = value;
            }
            if (types.includes("administrative_area_level_1")) {
                address.state = value;
            }
            if (types.includes("postal_code")) {
                address.zip = value;
            }
        });
        return address;
    };
    return (
        showGetLocation ? 
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
                        <input
                            className="form-control mt-0 text-bg-dark rounded"
                            ref={searchInput}
                            type="text"
                            placeholder="### Street"
                            onChange={(e) => resetAddressWarning(e)}
                        />
                    </div>
                </div>
            </div>
        : ""
    );
}
export default Welcome;