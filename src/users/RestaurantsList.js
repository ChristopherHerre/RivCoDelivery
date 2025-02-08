import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, Spinner, MAX_RETRY_ATTEMPTS } from '../App';
const mapApiJs = 'https://maps.googleapis.com/maps/api/js';

export function DeliveryAddress(props) {
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const address = props.address;
    const setAddress = props.setAddress;
    const [fullAddress, setFullAddress] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const loadAddress = async () => {
            setError(null);
            try {
                const addr = await getFullAddress(address);
                console.log(addr);
                setFullAddress(addr);
                if (addr.length > 0 && !addr.includes("null")) {
                     setShowGetLocation(false);
                } else {
                     setShowGetLocation(true);
                }
            } catch (error) {
                console.error("Error loading address:", error);
                setError("Unable to load address");
                setShowGetLocation(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadAddress();
    }, [address, setShowGetLocation]);

    async function editAddress(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setShowGetLocation(true);
                setAddress("");
                setFullAddress("");
                navigate("/");
            } else {
                console.error('Failed to update address');
            }
        } catch (error) {
            console.error('Error updating address:', error);
        }
    }

    return (
        <div>
            <b>Deliver to: </b>
            {isLoading ? (
                <Spinner />
            ) : error ? (
                <span className="text-danger">
                    {error}
                </span>
            ) : (
                <>
                    {!showGetLocation ? (
                        <mark>{fullAddress}</mark>
                    ) : (
                        <u className="text-danger">
                            Address Required!
                        </u>
                    )}
                    <span> </span>
                    <b>
                        <a href="#" onClick={(e) => editAddress(e)}>
                            <i className="bi bi-pencil-square"></i>
                        </a>
                    </b>
                </>
            )}
        </div>
    );
}

export async function getFullAddress(address) {
    if (address === undefined) {
        try {
            const response = await axios.get(`${API_URL}/api/user/full-address`, {
                withCredentials: true
            });
            address = response.data.address;
        } catch (error) {
            console.error('Error fetching address:', error);
            return "Error";
        }
    }

    const streetNumber = address.streetNumber + " ";
    const street = address.street ? address.street + ", " : "";
    const city = address.city ? address.city + ", " : "";
    const state = address.state ? address.state + " " : "";
    const zip = address.zip;
    //if (streetNumber == null || street == null || city == null || state == null || zip == null)
    //    return null;
    return streetNumber + street + city + state + zip;
}

export default function RestaurantsList(props) {
    const USDollar = props.USDollar;
    const debug = props.debug;
    const roundedToFixed = props.roundedToFixed;
    const setDeliveryFee = props.setDeliveryFee;
    const setRestaurant = props.setRestaurant;
    const setRestaurantName = props.setRestaurantName;
    const setRestaurantAddress = props.setRestaurantAddress;
    const address = props.address;
    const setAddress = props.setAddress;
    const setDistance = props.setDistance;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantsCopy, setRestaurantsCopy] = useState([]);
    const searchInput = useRef(null);
    const latitude = props.latitude;
    const setLatitude = props.setLatitude;
    const longitude = props.longitude;
    const setLongitude = props.setLongitude;
    const [itemConfig, setItemConfig] = useState([]);
    const [query, setQuery] = useState("");
    const result = Object.groupBy(restaurants, r => r.category);
    const [apiKey, setApiKey] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [loadingApiKey, setLoadingApiKey] = useState(false);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/user/address`, {
                    withCredentials: true
                });
                setAddress(res.data.address);
                setLatitude(res.data.latitude);
                setLongitude(res.data.longitude);
                if (res.data.address.streetNumber) {
                    setShowGetLocation(false);
                }
            } catch (err) {
                console.error('Error fetching address:', err);
            }
        };

        if (!showGetLocation) {
            fetchAddress();
        }
    }, [showGetLocation]);
    
    useEffect(() => {
        const fetchApiKey = async (attempt = 1) => {
            console.log("Fetching API key...");
            setLoadingApiKey(true);
            try {
                const res = await axios.get(API_URL + '/api/maps-api-key');
                setApiKey(res.data.apiKey);
                console.log('Fetched API Key:', res.data.apiKey);
            } catch (error) {
                console.error('Error fetching API key:', error);
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchApiKey(attempt + 1);
                } else {
                    window.location.href = '/404-page.html';
                }
            } finally {
                setLoadingApiKey(false);
            }
        };
        if (showGetLocation) {
            console.log("showGetLocation is true, fetching API key...");
            fetchApiKey();
        } else {
            console.log("showGetLocation is false, not fetching API key.");
        }
    }, [showGetLocation]);

    useEffect(() => {
        if (apiKey) {
            console.log('API Key is set:', apiKey);
            console.log('Initializing map script...');
            initMapScript().then(() => {
                console.log('Map script loaded, initializing autocomplete...');
                initAutocomplete();
            }).catch(error => {
                console.error('Error loading map script:', error);
            });
        } else {
            console.error('API Key is not set.');
        }
    }, [apiKey]);

    useEffect(() => {
        const fetchRestaurants = async (attempt = 1) => {
            try {
                const url = API_URL + `/api/restaurants/${latitude}/${longitude}`;
                const res = await axios.get(url);
                const restaurants = res.data.map(r => r);
                setRestaurants(restaurants);
                setRestaurantsCopy(restaurants);
                setLoaded(true);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchRestaurants(attempt + 1);
                } else {
                    window.location.href = '/404-page.html';
                }
            }
        };
        if (latitude && longitude) {
            fetchRestaurants();
        }
    }, [latitude, longitude, setRestaurants]);

    async function loadAsyncScript(src) {
        console.log("Calling loadAsyncScript with src:", src);
        return new Promise(resolve => {
            const script = document.createElement("script");
            Object.assign(script, {
                type: "text/javascript",
                async: true,
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
            console.log(component);
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

    const onChangeAddress = (autocomplete) => {
        const place = autocomplete.getPlace();
        if (place) {
            const address = extractAddress(place);
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            axios.post(`${API_URL}/api/user/address`, 
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

    function addressDisplayed() {
        return (
            <div className="address">
                <small>
                    Street: {address.streetNumber} {address.street}
                </small>
                <br />
                <small>City: {address.city}</small>
                <br />
                <small>State: {address.state}</small>
                <br />
                <small>Zip: {address.zip}</small>
            </div>
        );
    }

    function resetAddressWarning(e) {
        return e.target.value.length == 0 ? setShowGetLocation(true) : "";
    }

    function handleSearch(e) {
        let val = e.target.value;
        setQuery(val);
        if (val.length == 0) {
            val = null;
        }
        axios.get(API_URL + '/api/menu/item/search', { params: { menuItemName: val } })
            .then(res => {
                setItemConfig(res.data);
                setRestaurants(res.data.length <= 0 ? restaurantsCopy : restaurants.filter((r) => {
                    return res.data.find(x => x.restaurant_id === r.id);
                }));
            });
    }

    let lastCategory = "";
    function setLastCategoryPrinted(v) {
        lastCategory = v;
    }

    const restaurantData = [];
    function populateRestaurantData() {
        for (const j in result) {
            for (const i in result[j]) {
                restaurantData.push(result[j][i]);
            }
        }
    }
    populateRestaurantData();

    // Sort restaurantData based on Haversine distance
    restaurantData.sort((a, b) => {
        const distanceA = haversine_dist(a.latitude, a.longitude, latitude, longitude);
        const distanceB = haversine_dist(b.latitude, b.longitude, latitude, longitude);
        return distanceA - distanceB;
    });

    function Welcome() {
        
        useEffect(() => {
            if (apiKey) {
                console.log('API Key is set, initializing map script in Welcome...');
                initMapScript().then(() => {
                    console.log('Map script loaded in Welcome, initializing autocomplete...');
                    initAutocomplete();
                }).catch(error => {
                    console.error('Error loading map script in Welcome:', error);
                });
            }
        }, [apiKey]);
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
                    {debug ? addressDisplayed : ""}
                </div>
            : ""
        );
    }
    return (
        <>
            {loadingApiKey && <Spinner />}
            <Welcome />
            <br />
            {
                !showGetLocation ?
                    <div className="row">
                        <div className="col-lg-6">
                            <input 
                                placeholder="Search for item..." 
                                className="form-control text-bg-dark rounded" 
                                value={query} 
                                onChange={(e) => handleSearch(e)} 
                                type="text" 
                            />
                        </div>
                        <div className="col-lg-6">
                        
                        </div>
                    </div>
                : ""
            }
            {!showGetLocation && loaded ? 
                Object.keys(result).map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                        <div className="row">
                            <h5 className="indent">
                                {category}
                            </h5>
                            {result[category].map((data, key) => {
                                const h = haversine_dist(data.latitude, data.longitude, latitude, longitude);
                                const fee = 10 + (h < 1 ? 1 : h);
                                const maxFee = 100;
                                function selectRestaurant(data) {
                                    setRestaurantName(data.name);
                                    setRestaurant(data.id);
                                    setRestaurantAddress(data.address);
                                    setDeliveryFee(fee);
                                    setDistance(h);
                                }
                                return (
                                    <div className="col-md-6" key={key}>
                                        <Link to={"/menu"}>
                                            <button
                                                className="btn btn-primary m-1 w-100"
                                                onClick={(e) => selectRestaurant(data)}>
                                                <b>{data.name} </b>
                                                <small>
                                                    ({fee > maxFee ? "--" 
                                                        : USDollar.format(roundedToFixed(fee, 2))}
                                                        <span> Delivery Fee</span>)
                                                </small>
                                                 <div>
                                                    <span>{data.address} - </span>
                                                    <small>
                                                        <span>
                                                            {h < 100 ? roundedToFixed(h, 1) : "--"}
                                                        </span> Miles
                                                    </small>
                                                </div>
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
                :
                (!showGetLocation ? 
                    <Spinner />
                : "")
            }
        </>
    );
}

export function haversine_dist(lat, lng, lat2, lng2) {
    var R = 3958.8;
    var rlat1 = lat2 * (Math.PI / 180);
    var rlat2 = lat * (Math.PI / 180);
    var difflat = rlat2 - rlat1;
    var difflon = (lng - lng2) * (Math.PI / 180);
    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

export function getStreetOnly(address) {
    return address.streetNumber + " " + address.street;
}

