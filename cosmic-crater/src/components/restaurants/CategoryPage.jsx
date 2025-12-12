import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRestaurantMenuUrl } from '../../utils/restaurantUrls';
import Spinner from '../users/Spinner';
import ResponsiveFlexRow from '../common/ResponsiveFlexRow';

export default function CategoryPage(props) {
    const params = useParams();
    const { city, category } = params;
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [cityName, setCityName] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [loaded, setLoaded] = useState(false);
    const USDollar = props.USDollar;
    const roundedToFixed = props.roundedToFixed;
    const setDeliveryFee = props.setDeliveryFee;
    const setRestaurant = props.setRestaurant;
    const setRestaurantName = props.setRestaurantName;
    const setRestaurantAddress = props.setRestaurantAddress;
    const setDistance = props.setDistance;
    const latitude = props.latitude;
    const longitude = props.longitude;

    useEffect(() => {
        const fetchCategoryRestaurants = async () => {
            try {
                // Decode category from slug (e.g., "chinese-food" -> "Chinese Food")
                // First, get all restaurants in the city to find the actual category name
                const cityRes = await axios.get(`/api/restaurants-by-city?city_slug=${encodeURIComponent(city)}`);
                
                if (cityRes.data && cityRes.data.length > 0) {
                    setCityName(cityRes.data[0].city_name || city);
                    
                    // Find the actual category name by matching slug
                    const categorySlug = category.toLowerCase();
                    const matchingCategory = cityRes.data.find(r => {
                        if (!r.category) return false;
                        const rCategorySlug = r.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return rCategorySlug === categorySlug;
                    });
                    
                    if (matchingCategory) {
                        setCategoryName(matchingCategory.category);
                        
                        // Now fetch restaurants with this exact category
                        const categoryRes = await axios.get(
                            `/api/public/restaurants-by-city-and-category?city_slug=${encodeURIComponent(city)}&category=${encodeURIComponent(matchingCategory.category)}`
                        );
                        
                        if (categoryRes.data) {
                            setRestaurants(categoryRes.data);
                        }
                    }
                }
                setLoaded(true);
            } catch (error) {
                console.error('Error fetching category restaurants:', error);
                setLoaded(true);
            }
        };

        if (city && category) {
            fetchCategoryRestaurants();
        }
    }, [city, category]);

    const slugify = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const haversine_dist = (lat1, lon1, lat2, lon2) => {
        const R = 3958.8; // Earth radius in miles
        const rlat1 = lat1 * (Math.PI / 180);
        const rlat2 = lat2 * (Math.PI / 180);
        const difflat = rlat2 - rlat1;
        const difflon = (lon2 - lon1) * (Math.PI / 180);
        const d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
        return d;
    };

    return (
        <div className="mx-auto">
            {loaded ? (
                <>
                    <nav className="mb-4 text-sm text-gray-600">
                        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
                        <span className="mx-2">/</span>
                        <Link to={`/restaurants/${city}`} className="text-blue-600 hover:underline">{cityName || city}</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{categoryName || category}</span>
                    </nav>
                    <header className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {categoryName || category} in {cityName || city}
                        </h1>
                        {restaurants.length > 0 && (
                            <p className="text-lg text-gray-700 mb-2">
                                Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} in this category
                            </p>
                        )}
                    </header>

                    {restaurants.length === 0 ? (
                        <p className="text-gray-600">No restaurants found in this category for {cityName || city} yet.</p>
                    ) : (
                        <div className="flex flex-wrap -mx-3">
                            {restaurants.map((r) => {
                                const h = latitude && longitude ? haversine_dist(
                                    r.latitude,
                                    r.longitude,
                                    latitude,
                                    longitude
                                ) : null;
                                const fee = h ? (10 + (h < 1 ? 1 : h)) : null;
                                const maxFee = 100;

                                async function selectRestaurant(data) {
                                    setRestaurant(data.id);
                                    setRestaurantName(data.name);
                                    setRestaurantAddress(data.address);
                                    if (fee) setDeliveryFee(fee);
                                    if (h) setDistance(h);
                                    const menuUrl = getRestaurantMenuUrl(data);
                                    navigate(menuUrl);
                                }

                                const slug = slugify(r.name);
                                return (
                                    <div className="w-full md:w-1/2 px-3 mb-3" key={r.id}>
                                        <article className="border border-gray-600 rounded-lg shadow-sm bg-gray-900 h-full hover:shadow-md transition-shadow">
                                            <ResponsiveFlexRow className="h-full">
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className="text-lg font-semibold mb-2">
                                                        <button
                                                            onClick={(e) => selectRestaurant(r)}
                                                            className="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors"
                                                        >
                                                            {r.name}
                                                        </button>
                                                    </h3>
                                                    <p className="mb-1 text-base">
                                                        <strong className="font-semibold text-white">{r.category}</strong>
                                                    </p>
                                                    <p className="mb-2 text-base text-gray-300">{r.address}</p>
                                                    {h && h < 100 && (
                                                        <p className="mb-2 text-sm text-gray-400">
                                                            Distance: {roundedToFixed(h, 1)} mi
                                                            {fee && fee <= maxFee && (
                                                                <span className="ml-2">
                                                                    • Delivery Fee: {USDollar.format(roundedToFixed(fee, 2))}
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="p-4 flex items-center">
                                                    <Link
                                                        to={getRestaurantMenuUrl(r)}
                                                        className="inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer whitespace-nowrap"
                                                    >
                                                        View menu
                                                    </Link>
                                                </div>
                                            </ResponsiveFlexRow>
                                        </article>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-wrap text-center">
                    <div className="w-full">
                        <Spinner />
                    </div>
                </div>
            )}
        </div>
    );
}

