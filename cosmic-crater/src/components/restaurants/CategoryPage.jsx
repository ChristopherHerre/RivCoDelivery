import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRestaurantMenuUrl } from '../../utils/restaurantUrls';
import Button from '../common/Button';
import LikeButton from '../common/LikeButton';
import Carousel, { CarouselItem } from '../common/Carousel';
import SkeletonCard from '../common/SkeletonCard';
import EmptyState from '../common/EmptyState';

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
    const [profile, setProfile] = useState(null);
    const [restaurantLikes, setRestaurantLikes] = useState({});

    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, []);

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
                            const restaurantsData = categoryRes.data;
                            setRestaurants(restaurantsData);
                            
                            // Fetch like status for each restaurant if user is logged in
                            const storedProfile = localStorage.getItem('profile');
                            if (storedProfile) {
                                const likesMap = {};
                                await Promise.all(restaurantsData.map(async (restaurant) => {
                                    try {
                                        const likeRes = await axios.get(`/api/restaurants/${restaurant.id}/like-status`, {
                                            withCredentials: true
                                        });
                                        likesMap[restaurant.id] = {
                                            likes: restaurant.likes || 0,
                                            liked: likeRes.data.liked || false
                                        };
                                    } catch (err) {
                                        likesMap[restaurant.id] = {
                                            likes: restaurant.likes || 0,
                                            liked: false
                                        };
                                    }
                                }));
                                setRestaurantLikes(likesMap);
                            } else {
                                const likesMap = {};
                                restaurantsData.forEach(restaurant => {
                                    likesMap[restaurant.id] = {
                                        likes: restaurant.likes || 0,
                                        liked: false
                                    };
                                });
                                setRestaurantLikes(likesMap);
                            }
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
        <div className="w-full">
            {loaded ? (
                <>
                    <div className="mb-6">
                        <div className="py-4 bg-gray-800 rounded-xl">
                            <h1 className="text-2xl font-bold mb-4 text-white px-4">
                                {categoryName || category} in {cityName || city}
                            </h1>
                            {restaurants.length > 0 && (
                                <p className="text-base-content/70 px-4 mb-4">
                                    Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} in this category
                                </p>
                            )}
                        </div>
                    </div>

                    {restaurants.length === 0 ? (
                        <EmptyState
                            title="No Restaurants Found"
                            message={`No restaurants found in this category for ${cityName || city} yet.`}
                            icon="bi-emoji-frown"
                        />
                    ) : (
                        <div className="mb-6">
                            <div className="py-4 bg-gray-800 rounded-xl">
                                <Carousel
                                    id="category-carousel"
                                    scrollAmount={400}
                                    carouselClassName="px-12"
                                    ariaLabel={`${categoryName || category} restaurants carousel`}
                                >
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

                                        return (
                                            <CarouselItem key={r.id}>
                                                <div className="card bg-base-100 w-96 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
                                                    <div className="card-body">
                                                        <h2 className="card-title">
                                                            <button
                                                                onClick={(e) => selectRestaurant(r)}
                                                                className="text-white link link-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded text-xl font-bold"
                                                            >
                                                                {r.name}
                                                            </button>
                                                            <div className="badge badge-secondary badge-lg">{r.category}</div>
                                                        </h2>
                                                        <p className="text-base-content/70 text-sm mb-2">{r.address}</p>
                                                        {h && h < 100 && (
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <i className="bi bi-geo-alt text-primary" aria-hidden="true"></i>
                                                                    <span className="text-sm font-semibold text-base-content">
                                                                        {roundedToFixed(h, 1)} mi
                                                                    </span>
                                                                </div>
                                                                {fee && fee <= maxFee && (
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
                                                                to={getRestaurantMenuUrl(r)}
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
                                                                itemId={r.id}
                                                                itemType="restaurant"
                                                                initialLikes={restaurantLikes[r.id]?.likes || r.likes || 0}
                                                                initialLiked={restaurantLikes[r.id]?.liked || false}
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
                    )}
                </>
            ) : (
                <div className="mb-6">
                    <div className="py-4 bg-gray-800 rounded-xl">
                        <div className="h-8 bg-primary/30 rounded w-32 mb-4 mx-4 animate-pulse"></div>
                        <Carousel 
                            id="skeleton-carousel" 
                            scrollAmount={400} 
                            carouselClassName="px-12" 
                            showNavigation={false}
                        >
                            {[...Array(3)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </Carousel>
                    </div>
                </div>
            )}
        </div>
    );
}

