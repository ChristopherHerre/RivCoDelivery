import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import Welcome from '../users/address/Welcome';
import { getRestaurantMenuUrl, getRestaurantCategoryUrl } from '../../utils/restaurantUrls';
import CityFilter from './CityFilter';
import LikeButton from '../common/LikeButton';
import Button from '../common/Button';
import Carousel, { CarouselItem } from '../common/Carousel';

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
    const [selectedCities, setSelectedCities] = useState([]);
    const [searchFilteredRestaurants, setSearchFilteredRestaurants] = useState([]);
    const result = groupBy(restaurants, r => r.category);
    const [loaded, setLoaded] = useState(false);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [locLoaded, setLocLoaded] = useState(false);
    const [restaurantLikes, setRestaurantLikes] = useState({}); // { restaurantId: { likes: number, liked: boolean } }

    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

    // Add this: Listen for profile changes
    useEffect(() => {
        const handleProfileChange = () => {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            }
        };
        window.addEventListener('profile-changed', handleProfileChange);
        return () => window.removeEventListener('profile-changed', handleProfileChange);
    }, []);

    // Auto-select city filter from URL when SPA loads on /restaurants/:city route
    // Clear city filter when navigating to home
    useEffect(() => {
        const pathname = location.pathname;
        
        // Clear city filter when on home page
        if (pathname === '/') {
            setSelectedCities([]);
            return;
        }
        
        // Check if we're on a /restaurants/:city route (exact match, no sub-paths)
        const cityRouteMatch = pathname.match(/^\/restaurants\/([^\/]+)$/);
        if (cityRouteMatch) {
            const citySlug = cityRouteMatch[1];
            // Set the city filter to match the URL
            // Use functional update to avoid dependency on selectedCities
            setSelectedCities(prev => {
                // Only update if different to avoid unnecessary re-renders
                if (prev.length === 1 && prev[0] === citySlug) {
                    return prev;
                }
                return [citySlug];
            });
        }
    }, [location.pathname]);

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
            // Only fetch if user is logged in
            const storedProfile = localStorage.getItem('profile');
            if (!storedProfile) {
                setLocLoaded(true);
                return;
            }
            
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
    }, [profile]); // Add profile as dependency

    // Apply filters based on search query and selected cities
    const applyFilters = (searchResults, cities, sourceRestaurants) => {
        let filtered = sourceRestaurants || restaurantsCopy;

        // Apply search filter if there are search results
        if (searchResults && searchResults.length > 0) {
            filtered = filtered.filter((r) => {
                return searchResults.find(x => x.restaurant_id === r.id);
            });
        }

        // Apply city filter if cities are selected
        if (cities && cities.length > 0) {
            filtered = filtered.filter((r) => {
                return r.city_slug && cities.includes(r.city_slug);
            });
        }

        setRestaurants(filtered);
    };

    useEffect(() => {
        const fetchRestaurants = async (attempt = 1) => {
            try {
                const url = `/api/restaurants/${latitude}/${longitude}`;
                const res = await axios.get(url);
                const restaurants = res.data.map(r => r);
                setRestaurantsCopy(restaurants);
                
                // Fetch like status for each restaurant if user is logged in
                const storedProfile = localStorage.getItem('profile');
                if (storedProfile) {
                    const likesMap = {};
                    await Promise.all(restaurants.map(async (restaurant) => {
                        try {
                            const likeRes = await axios.get(`/api/restaurants/${restaurant.id}/like-status`, {
                                withCredentials: true
                            });
                            likesMap[restaurant.id] = {
                                likes: restaurant.likes || 0,
                                liked: likeRes.data.liked || false
                            };
                        } catch (err) {
                            // If error, just use default values
                            likesMap[restaurant.id] = {
                                likes: restaurant.likes || 0,
                                liked: false
                            };
                        }
                    }));
                    setRestaurantLikes(likesMap);
                } else {
                    // User not logged in - just set likes counts
                    const likesMap = {};
                    restaurants.forEach(restaurant => {
                        likesMap[restaurant.id] = {
                            likes: restaurant.likes || 0,
                            liked: false
                        };
                    });
                    setRestaurantLikes(likesMap);
                }
                
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

    // Re-apply filters when restaurantsCopy or filter states change
    useEffect(() => {
        if (restaurantsCopy.length > 0) {
            applyFilters(searchFilteredRestaurants, selectedCities, restaurantsCopy);
        }
    }, [restaurantsCopy, searchFilteredRestaurants, selectedCities]);

    function handleSearch(e) {
        let val = e.target.value;
        setQuery(val);
        if (val.length === 0) {
            // Reset search filter, but keep city filter
            setSearchFilteredRestaurants([]);
            applyFilters([], selectedCities, restaurantsCopy);
            return;
        }
        axios.get('/api/menu/item/search', { params: { menuItemName: val } })
            .then(res => {
                setItemConfig(res.data);
                setSearchFilteredRestaurants(res.data);
                applyFilters(res.data, selectedCities, restaurantsCopy);
            }
        );
    }

    function handleCityChange(cities) {
        setSelectedCities(cities);
        applyFilters(searchFilteredRestaurants, cities, restaurantsCopy);
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
            {!showGetLocation && loaded ? (
                <div className="w-full">
                    {/* City Filter, Search Input, and Ad Space */}
                    <div className="card bg-base-100 shadow-md mb-4">
                        <div className="card-body p-4">
                            <div className="flex flex-wrap md:flex-nowrap gap-4">
                                <div className="w-full md:w-1/2">
                                    <CityFilter 
                                        selectedCities={selectedCities}
                                        onCityChange={handleCityChange}
                                    />
                                </div>
                                <div className="w-full md:w-1/2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-base-content">Search for item:</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Search for item..." 
                                            className="input input-bordered w-full bg-base-200 text-base-content placeholder:text-base-content/50" 
                                            value={query} 
                                            onChange={(e) => handleSearch(e)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-4">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => navigate('/suggest-restaurant')}
                            className="whitespace-nowrap"
                        >
                            <i className="bi bi-plus-circle"></i>
                            Suggest a Restaurant
                        </Button>
                    </div>

                    {/* Restaurants by Category */}
                    {restaurants.length === 0 ? (
                        <p className="text-gray-600">No restaurants found in this area yet.</p>
                    ) : (
                        Object.keys(result).map((category, categoryIndex) => {
                            // Get city_slug from first restaurant in category (all should have same city)
                            const firstRestaurant = result[category][0];
                            const citySlug = firstRestaurant?.city_slug;
                            const categoryUrl = citySlug ? getRestaurantCategoryUrl(citySlug, category) : null;
                            
                            return (
                                <div key={categoryIndex} className="mb-6">
                                    {categoryUrl ? (
                                        <h2 className="text-2xl font-bold mb-4 text-primary px-12">
                                            <button
                                                onClick={() => navigate(categoryUrl)}
                                                className="link link-hover text-primary"
                                            >
                                                {category}
                                            </button>
                                        </h2>
                                    ) : (
                                        <h2 className="text-2xl font-bold mb-4 text-primary px-12">{category}</h2>
                                    )}
                                    <Carousel
                                        id={`carousel-${categoryIndex}`}
                                        scrollAmount={400}
                                        carouselClassName="px-12"
                                        className="py-4 bg-gray-800 rounded-xl"
                                    >
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
                                            <CarouselItem key={key}>
                                                <div className="card bg-base-100 w-96 shadow-sm">
                                                    <div className="card-body">
                                                        <h2 className="card-title">
                                                            <button
                                                                onClick={(e) => selectRestaurant(data)}
                                                                className="text-white link link-hover"
                                                            >
                                                                {data.name}
                                                            </button>
                                                            <div className="badge badge-secondary badge-lg">{data.category}</div>
                                                        </h2>
                                                        <p className="text-base-content/70">{data.address}</p>
                                                        {h < 100 && (
                                                            <p className="text-sm text-base-content/60">
                                                                Distance: {roundedToFixed(h, 1)} mi
                                                                {fee <= maxFee && (
                                                                    <span className="ml-2">
                                                                        • Delivery Fee: {USDollar.format(roundedToFixed(fee, 2))}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                        <div className="card-actions justify-end">
                                                            <Link
                                                                to={getRestaurantMenuUrl(data)}
                                                                className="no-underline"
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    type="button"
                                                                >
                                                                    View menu
                                                                </Button>
                                                            </Link>
                                                            <LikeButton
                                                                itemId={data.id}
                                                                itemType="restaurant"
                                                                initialLikes={restaurantLikes[data.id]?.likes || data.likes || 0}
                                                                initialLiked={restaurantLikes[data.id]?.liked || false}
                                                                profile={profile}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        );
                                        })}
                                    </Carousel>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (!showGetLocation ? <Spinner /> : null)}
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
