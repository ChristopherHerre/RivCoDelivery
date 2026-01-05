import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Welcome from '../users/address/Welcome';
import { getRestaurantMenuUrl, getRestaurantCategoryUrl } from '../../utils/restaurantUrls';
import CityFilter from './CityFilter';
import LikeButton from '../common/LikeButton';
import Button from '../common/Button';
import Carousel, { CarouselItem } from '../common/Carousel';
import SkeletonCard from '../common/SkeletonCard';
import EmptyState from '../common/EmptyState';
import MobileFilterDrawer from './MobileFilterDrawer';
import ActionButtons from './ActionButtons';
import TruncatedAddress from '../common/TruncatedAddress';

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
    const [isSearching, setIsSearching] = useState(false);
    const [searchResultsCount, setSearchResultsCount] = useState(0);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
                    try {
                        // Use bulk endpoint for better performance
                        const restaurantIds = restaurants.map(r => r.id);
                        const bulkLikeRes = await axios.post('/api/restaurants/like-status/bulk', 
                            { restaurantIds },
                            { withCredentials: true }
                        );
                        // bulkLikeRes.data format: { restaurantId: { likes: number, liked: boolean }, ... }
                        restaurants.forEach(restaurant => {
                            const status = bulkLikeRes.data[restaurant.id];
                            if (status) {
                                likesMap[restaurant.id] = {
                                    likes: status.likes !== undefined ? status.likes : (restaurant.likes || 0),
                                    liked: status.liked || false
                                };
                            } else {
                                // Fallback if restaurant not in response
                                likesMap[restaurant.id] = {
                                    likes: restaurant.likes || 0,
                                    liked: false
                                };
                            }
                        });
                    } catch (err) {
                        // Fallback to individual requests if bulk endpoint fails or doesn't exist
                        console.warn('Bulk like status endpoint failed, falling back to individual requests:', err);
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
                    }
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
            setIsSearching(false);
            setSearchFilteredRestaurants([]);
            setSearchResultsCount(0);
            applyFilters([], selectedCities, restaurantsCopy);
            return;
        }
        setIsSearching(true);
        axios.get('/api/menu/item/search', { params: { menuItemName: val } })
            .then(res => {
                setItemConfig(res.data);
                setSearchFilteredRestaurants(res.data);
                // Count unique restaurants in search results
                const uniqueRestaurants = new Set(res.data.map(item => item.restaurant_id));
                setSearchResultsCount(uniqueRestaurants.size);
                applyFilters(res.data, selectedCities, restaurantsCopy);
            })
            .catch(err => {
                console.error('Search error:', err);
                setSearchResultsCount(0);
            })
            .finally(() => {
                setIsSearching(false);
            });
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
                <>
                    {/* Mobile Filter Button - Only visible on mobile */}
                    <div className="sm:hidden mb-4">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="w-full"
                            aria-label="Open filters"
                        >
                            <i className="bi bi-funnel"></i>
                            Filters
                            {(selectedCities.length > 0 || query) && (
                                <span className="badge badge-primary badge-sm ml-2">
                                    {selectedCities.length + (query ? 1 : 0)}
                                </span>
                            )}
                        </Button>
                    </div>
                    
                    <div className="w-full flex flex-col sm:flex-row gap-4">
                        {/* Filters Column - Left Side (Sidebar) - Hidden on mobile */}
                        <div className="hidden sm:block w-full sm:w-64 flex-shrink-0 sm:sticky sm:top-24 sm:self-start">
                    <div className="card bg-base-100 shadow-md mb-4">
                        <div className="card-body p-4">
                                <div className="flex flex-col gap-4">
                                    <CityFilter 
                                        selectedCities={selectedCities}
                                        onCityChange={handleCityChange}
                                    />
                                    <div className="form-control">
                                        <div className="label justify-between items-center">
                                            <label htmlFor="search-item-input" className="label-text text-base-content font-bold">
                                                Filter by item name:
                                        </label>
                                            {query && searchResultsCount > 0 && (
                                                <span className="badge badge-primary badge-sm" aria-label={`${searchResultsCount} ${searchResultsCount === 1 ? 'restaurant' : 'restaurants'} found`}>
                                                    {searchResultsCount} found
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                        <input 
                                                id="search-item-input"
                                            type="text" 
                                            placeholder="Search for item..." 
                                                className="input input-bordered w-full bg-base-200 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 pr-10" 
                                            value={query} 
                                            onChange={(e) => handleSearch(e)} 
                                                aria-describedby="search-item-description"
                                                aria-busy={isSearching}
                                            />
                                            {isSearching && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm text-primary" aria-label="Searching"></span>
                                            )}
                                        </div>
                                        <div id="search-item-description" className="sr-only">
                                            Search for menu items across all restaurants
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ActionButtons profile={profile} />
                    </div>

                    {/* Restaurants Column - Right Side */}
                    <div className="flex-1 min-w-0">
                        {/* ARIA live region for dynamic content updates */}
                        <div aria-live="polite" aria-atomic="true" className="sr-only">
                            {!loaded ? 'Loading restaurants' : restaurants.length === 0 ? 'No restaurants found' : `${restaurants.length} restaurants found`}
                        </div>
                        {/* Loading skeleton */}
                        {!loaded && (
                            <>
                                {/* Mobile Filter Button Skeleton */}
                                <div className="sm:hidden mb-4">
                                    <div className="h-12 bg-primary/30 rounded animate-pulse"></div>
                                </div>
                                
                                <div className="w-full flex flex-col sm:flex-row gap-4">
                                    {/* Filters Column Skeleton - Left Side */}
                                    <div className="hidden sm:block w-full sm:w-64 flex-shrink-0 sm:sticky sm:top-24 sm:self-start">
                                        <div className="card bg-base-100 shadow-md mb-4">
                                            <div className="card-body p-4">
                                                <div className="flex flex-col gap-4">
                                                    {/* City Filter Skeleton */}
                                                    <div>
                                                        <div className="h-5 bg-primary/30 rounded w-24 mb-3 animate-pulse"></div>
                                                        <div className="space-y-2">
                                                            {[...Array(4)].map((_, i) => (
                                                                <div key={i} className="h-8 bg-primary/30 rounded animate-pulse"></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Search Input Skeleton */}
                                                    <div>
                                                        <div className="h-5 bg-primary/30 rounded w-32 mb-3 animate-pulse"></div>
                                                        <div className="h-10 bg-primary/30 rounded animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action Buttons Skeleton */}
                                        <div className="card bg-base-100 shadow-md mb-4">
                                            <div className="card-body p-4 flex flex-col gap-4">
                                                <div className="h-12 bg-primary/30 rounded animate-pulse"></div>
                                                <div className="h-12 bg-primary/30 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Restaurants Column Skeleton - Right Side */}
                                    <div className="flex-1 min-w-0">
                                        {/* Multiple Category Skeletons */}
                                        {[...Array(3)].map((_, categoryIndex) => (
                                            <div key={categoryIndex} className="mb-6">
                                                <div className="py-4 bg-gray-800 rounded-xl">
                                                    {/* Category Heading Skeleton */}
                                                    <div className="h-8 bg-primary/30 rounded w-32 mb-4 mx-4 animate-pulse"></div>
                                                    {/* Carousel Skeleton */}
                                                    <Carousel 
                                                        id={`skeleton-carousel-${categoryIndex}`} 
                                                        scrollAmount={400}
                                                        carouselClassName="px-4"
                                                        showNavigation={false}
                                                    >
                                                        {[...Array(3)].map((_, i) => (
                                                            <SkeletonCard key={i} />
                                                        ))}
                                                    </Carousel>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    {/* Restaurants by Category */}
                        {loaded && restaurants.length === 0 ? (
                            <EmptyState
                                title="No restaurants found"
                                message={
                                    query || selectedCities.length > 0
                                        ? "Try adjusting your filters or search terms to find more restaurants."
                                        : "No restaurants are available in this area yet. Check back later!"
                                }
                                icon={<i className="bi bi-shop"></i>}
                            />
                        ) : loaded && (
                            Object.keys(result).map((category, categoryIndex) => {
                            // Get city_slug from first restaurant in category (all should have same city)
                            const firstRestaurant = result[category][0];
                            const citySlug = firstRestaurant?.city_slug;
                            const categoryUrl = citySlug ? getRestaurantCategoryUrl(citySlug, category) : null;
                            
                            return (
                                <div key={categoryIndex} className="mb-6">
                                    <div className="py-4 bg-gray-800 rounded-xl">
                                    {categoryUrl ? (
                                            <h2 className="text-2xl font-bold mb-4 text-primary px-4">
                                            <button
                                                onClick={() => navigate(categoryUrl)}
                                                    className="link link-hover text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded"
                                            >
                                                {category}
                                            </button>
                                        </h2>
                                    ) : (
                                            <h2 className="text-2xl font-bold mb-4 text-primary px-4">{category}</h2>
                                        )}
                                        <Carousel
                                            id={`carousel-${categoryIndex}`}
                                            scrollAmount={400}
                                            carouselClassName="px-4"
                                            aria-label={`${category} restaurants carousel`}
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
                                                <div className="card bg-base-100 w-96 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
                                                    <div className="card-body">
                                                        <h2 className="card-title">
                                                            <button
                                                                onClick={(e) => selectRestaurant(data)}
                                                                className="text-white link link-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded text-xl font-bold"
                                                            >
                                                                {data.name}
                                                            </button>
                                                            <div className="badge badge-secondary badge-lg">{data.category}</div>
                                                        </h2>
                                                        <p className="text-base-content/70 text-sm mb-2">
                                                            <TruncatedAddress address={data.address} />
                                                        </p>
                                                        {h < 100 && (
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <i className="bi bi-geo-alt text-primary" aria-hidden="true"></i>
                                                                    <span className="text-sm font-semibold text-base-content">
                                                                        {roundedToFixed(h, 1)} mi
                                                                    </span>
                                                                </div>
                                                                {fee <= maxFee && (
                                                                    <div className="flex items-center gap-1">
                                                                        <i className="bi bi-truck text-secondary" aria-hidden="true"></i>
                                                                        <span className="text-sm font-semibold text-base-content">
                                                                            {USDollar.format(roundedToFixed(fee, 2))}
                                                                    </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="card-actions justify-end items-center">
                                                            <Link
                                                                to={getRestaurantMenuUrl(data)}
                                                                className="no-underline"
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    type="button"
                                                                    className="min-h-[32px]"
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
                                </div>
                            );
                        })
                    )}
                    </div>
                </div>
                
                {/* Mobile Filter Drawer */}
                <MobileFilterDrawer
                    isOpen={isFilterDrawerOpen}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    selectedCities={selectedCities}
                    onCityChange={handleCityChange}
                    query={query}
                    onSearchChange={(e) => handleSearch(e)}
                    isSearching={isSearching}
                    searchResultsCount={searchResultsCount}
                    onSuggestClick={() => {
                        setIsFilterDrawerOpen(false);
                        navigate('/suggest-restaurant');
                    }}
                    profile={profile}
                />
            </>
            ) : (!showGetLocation ? (
                <>
                    {/* Mobile Filter Button Skeleton */}
                    <div className="sm:hidden mb-4">
                        <div className="h-12 bg-primary/30 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="w-full flex flex-col sm:flex-row gap-4">
                        {/* Filters Column Skeleton - Left Side */}
                        <div className="hidden sm:block w-full sm:w-64 flex-shrink-0 sm:sticky sm:top-24 sm:self-start">
                            <div className="card bg-base-100 shadow-md mb-4">
                                <div className="card-body p-4">
                                    <div className="flex flex-col gap-4">
                                        {/* City Filter Skeleton */}
                                        <div>
                                            <div className="h-5 bg-primary/30 rounded w-24 mb-3 animate-pulse"></div>
                                            <div className="space-y-2">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="h-8 bg-primary/30 rounded animate-pulse"></div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Search Input Skeleton */}
                                        <div>
                                            <div className="h-5 bg-primary/30 rounded w-32 mb-3 animate-pulse"></div>
                                            <div className="h-10 bg-primary/30 rounded animate-pulse"></div>
                                        </div>
                                        {/* Suggest Button Skeleton */}
                                        <div>
                                            <div className="h-12 bg-primary/30 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Restaurants Column Skeleton - Right Side */}
                        <div className="flex-1 min-w-0">
                            {/* Multiple Category Skeletons */}
                            {[...Array(3)].map((_, categoryIndex) => (
                                <div key={categoryIndex} className="mb-6">
                                    <div className="py-4 bg-gray-800 rounded-xl">
                                        {/* Category Heading Skeleton */}
                                        <div className="h-8 bg-primary/30 rounded w-32 mb-4 mx-4 animate-pulse"></div>
                                        {/* Carousel Skeleton */}
                                        <Carousel 
                                            id={`skeleton-carousel-${categoryIndex}`} 
                                            scrollAmount={400}
                                            carouselClassName="px-4"
                                            showNavigation={false}
                                        >
                                            {[...Array(3)].map((_, i) => (
                                                <SkeletonCard key={i} />
                                            ))}
                                        </Carousel>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : null)}
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
