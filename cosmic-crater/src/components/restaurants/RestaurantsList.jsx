import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import Welcome from '../users/address/Welcome';
import { getRestaurantMenuUrl } from '../../utils/restaurantUrls';

export function groupBy(array, keyFn) {
    return array.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}

export default function RestaurantsList(props) {
    const USDollar = props.USDollar;
    const debug = props.debug;
    const roundedToFixed = props.roundedToFixed;
    const setDeliveryFee = props.setDeliveryFee;
    const restaurant = props.restaurant;
    const setRestaurant = props.setRestaurant;
    const setRestaurantName = props.setRestaurantName;
    const setRestaurantAddress = props.setRestaurantAddress;
    const address = props.address;
    const setAddress = props.setAddress;
    const setDistance = props.setDistance;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const latitude = props.latitude;
    const setLatitude = props.setLatitude;
    const longitude = props.longitude;
    const setLongitude = props.setLongitude;
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantsCopy, setRestaurantsCopy] = useState([]);
    const [itemConfig, setItemConfig] = useState([]);
    const [query, setQuery] = useState("");
    const result = groupBy(restaurants, r => r.category);
    const [loaded, setLoaded] = useState(false);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();
    const [locLoaded, setLocLoaded] = useState(false);

    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

    const updateUserRestaurant = async (restaurantId) => {
        if (!profile?.sub) return;
        try {
            console.log(`/api/users/${profile.sub}/selected_restaurant`);
            await axios.put(`/api/users/${profile.sub}/selected_restaurant`, 
                { restaurant_id: restaurantId }, // <-- correct key
                { withCredentials: true }
            );
        } catch (err) {
            console.error('Error updating user restaurant:', err);
        }
    };

    // On first load, determine from the backend whether the user already has
    // a saved address. Only *after* this runs do we decide whether to show
    // the welcome / get-location screen.
    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await axios.get(`/api/user/address`, {
                    withCredentials: true
                });

                setAddress(res.data.address);
                setLatitude(res.data.latitude);
                setLongitude(res.data.longitude);

                if (res.data.address && res.data.address.streetNumber) {
                    // Address exists – do NOT show the welcome component.
                    setShowGetLocation(false);
                } else {
                    // No saved address – show welcome / get-location.
                    setShowGetLocation(true);
                }
            } catch (err) {
                console.error('Error fetching address:', err);
            } finally {
                setLocLoaded(true);
            }
        };

        fetchAddress();
    }, []);

    useEffect(() => {
        const fetchRestaurants = async (attempt = 1) => {
            try {
                const url = `/api/restaurants/${latitude}/${longitude}`;
                const res = await axios.get(url);
                const restaurants = res.data.map(r => r);
                setRestaurants(restaurants);
                setRestaurantsCopy(restaurants);
                setLoaded(true);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchRestaurants(attempt + 1);
                }
            }
        };
        if (latitude && longitude)
        {     
            fetchRestaurants();
        }
    }, [latitude, longitude, setRestaurants]);

    function handleSearch(e) {
        let val = e.target.value;
        setQuery(val);
        if (val.length === 0) {
            // Reset to the original list when the search string is empty
            setRestaurants(restaurantsCopy);
            return;
        }
        axios.get('/api/menu/item/search', { params: { menuItemName: val } })
            .then(res => {
                setItemConfig(res.data);
                setRestaurants(
                    res.data.length <= 0
                        ? restaurantsCopy
                        : restaurantsCopy.filter((r) => {
                            return res.data.find(x => x.restaurant_id === r.id);
                        })
                );
            }
        );
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
    restaurantData.sort((a, b) => {
        const distanceA = haversine_dist(
            a.latitude, 
            a.longitude, 
            latitude, 
            longitude
        );
        const distanceB = haversine_dist(
            b.latitude, 
            b.longitude, 
            latitude, 
            longitude
        );
        return distanceA - distanceB;
    });
    return (
        <>
            {locLoaded && showGetLocation ? (<Welcome
                address={address}
                setAddress={setAddress}
                showGetLocation={showGetLocation}
                setShowGetLocation={setShowGetLocation}
            />) : null
            }
            {
                !showGetLocation && loaded ?
                    <div className="row">
                        <div className="col-12 col-md-4 mb-1">
                            <input 
                                placeholder="Search for item..." 
                                className="form-control text-bg-dark rounded" 
                                value={query} 
                                onChange={(e) => handleSearch(e)} 
                                type="text" 
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <Link to={"/taxi"}>
                                <button className="btn btn-dark form-control">
                                    <i className="bi bi-taxi-front-fill"> </i>
                                    Taxi Ride
                                </button>
                            </Link>
                        </div>
                    </div>
                : ""
            }
            {!showGetLocation && loaded  ? 
                Object.keys(result).map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                        <h5 className="indent">
                            {category}
                        </h5>
                        <div className="restaurant-grid">
                            {result[category].map((data, key) => {
                                const h = haversine_dist(
                                    data.latitude, 
                                    data.longitude, 
                                    latitude, 
                                    longitude
                                );
                                const fee = 10 + (h < 1 ? 1 : h);
                                const maxFee = 100;
                                async function selectRestaurant(data) {       
                                    setRestaurant(data.id);
                                    setRestaurantName(data.name);
                                    setRestaurantAddress(data.address);
                                    setDeliveryFee(fee);
                                    setDistance(h);
                                    //await updateUserRestaurant(data.id);
                                    // Use new URL format matching SSR pages
                                    const menuUrl = getRestaurantMenuUrl(data);
                                    navigate(menuUrl);
                                    console.log("Restaurant selected:", data.id);
                                }
                                return (
                                    <div className="restaurant-card" key={key}>
                                        <button
                                            className="btn btn-primary form-control"
                                            onClick={(e) => selectRestaurant(data)}>
                                            <b>{data.name} 
                                                <span className="badge bg-info text-dark ms-2">
                                                    {h < 100 ? `${roundedToFixed(h, 1)} mi` : "--"}
                                                </span>
                                            </b>
                                            <small>
                                                ({fee > maxFee ? "--" 
                                                    : USDollar.format(roundedToFixed(fee, 2))}
                                                    <span> Delivery Fee</span>)
                                            </small>
                                            <div>
                                                <span>{data.address} </span>
                                                
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )) : (!showGetLocation ? <Spinner /> : "")
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
