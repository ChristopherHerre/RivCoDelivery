import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import { groupBy } from '../RestaurantsList';
import { useParams } from 'react-router-dom';
import { parseRestaurantId, getRestaurantMenuItemUrl, slugify, getMenuItemUrl } from '../../../utils/restaurantUrls';
import LikeButton from '../../common/LikeButton';
import Button from '../../common/Button';
import Carousel, { CarouselItem } from '../../common/Carousel';
import SkeletonCard from '../../common/SkeletonCard';
import EmptyState from '../../common/EmptyState';

export default function Menu(props) {
    const params = useParams();
    const { restaurant: restaurantParam, city } = params;
    const menuItem = props.menuItem;
    const setMenuItem = props.setMenuItem;
    const [restaurantName, setRestaurantName] = useState(props.restaurantName || "");
    const [restaurantData, setRestaurantData] = useState(null);
    const [menu, setMenu] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const result = groupBy(menu, r => r.category);
    const [loaded, setLoaded] = useState(false);
    const [profile, setProfile] = useState(null);
    const [menuItemLikes, setMenuItemLikes] = useState({}); // { menuItemId: { likes: number, liked: boolean } }
    
    // Check if we're actually on a menu item page (shouldn't render Menu component)
    // This prevents Menu from rendering when React Router incorrectly matches the route
    React.useEffect(() => {
        const currentPath = location.pathname;
        // If the path contains /menu/ followed by something that's not "item", we're on a menu item page
        // In that case, this component shouldn't have rendered - let React Router handle it
        if (currentPath.includes('/menu/') && !currentPath.endsWith('/menu/item')) {
            // We're on a menu item page, but Menu component rendered - this shouldn't happen
            // Don't do anything - let the RouteSyncHandler fix the route matching
            console.warn('[Menu] Component rendered on menu item page:', currentPath);
        }
    }, [location.pathname]);

    // Parse restaurant ID from param (could be just ID or "id-slug" format)
    const restaurantId = React.useMemo(() => {
        if (!restaurantParam) return null;
        // If it's a number, use it directly (backward compatibility)
        const numId = Number(restaurantParam);
        if (!Number.isNaN(numId)) return numId;
        // Otherwise parse from slug format like "37-krispy-kream"
        return parseRestaurantId(restaurantParam);
    }, [restaurantParam]);

    // Load profile
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
        
        const handleProfileChange = () => {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                setProfile(JSON.parse(storedProfile));
            } else {
                setProfile(null);
            }
        };
        window.addEventListener('profile-changed', handleProfileChange);
        return () => window.removeEventListener('profile-changed', handleProfileChange);
    }, []);

    useEffect(() => {
        const fetchRestaurantAndMenu = async (attempt = 1) => {
            if (!restaurantId) {
                navigate("/");
                return;
            }

            try {
                // Fetch restaurant data to get name and city_slug
                const restaurantRes = await axios.get(`/api/public/restaurants/${restaurantId}`);
                const restaurant = restaurantRes.data;
                setRestaurantData(restaurant);
                if (restaurant.name) {
                    setRestaurantName(restaurant.name);
                }

                // Fetch menu
                const menuRes = await axios.get(`/api/restaurants2/${restaurantId}/menu`);
                console.log(menuRes.data);
                setMenu(menuRes.data);
                
                // Fetch like status for each menu item if user is logged in
                const storedProfile = localStorage.getItem('profile');
                if (storedProfile) {
                    const likesMap = {};
                    try {
                        // Use bulk endpoint for better performance
                        const menuItemIds = menuRes.data.map(item => item.id);
                        const bulkLikeRes = await axios.post('/api/menu-items/like-status/bulk',
                            { menuItemIds },
                            { withCredentials: true }
                        );
                        // bulkLikeRes.data format: { menuItemId: { likes: number, liked: boolean }, ... }
                        menuRes.data.forEach(item => {
                            const status = bulkLikeRes.data[item.id];
                            if (status) {
                                likesMap[item.id] = {
                                    likes: status.likes !== undefined ? status.likes : (item.likes || 0),
                                    liked: status.liked || false
                                };
                            } else {
                                // Fallback if menu item not in response
                                likesMap[item.id] = {
                                    likes: item.likes || 0,
                                    liked: false
                                };
                            }
                        });
                    } catch (err) {
                        // Fallback to individual requests if bulk endpoint fails or doesn't exist
                        console.warn('Bulk like status endpoint failed, falling back to individual requests:', err);
                        await Promise.all(menuRes.data.map(async (item) => {
                            try {
                                const likeRes = await axios.get(`/api/menu-items/${item.id}/like-status`, {
                                    withCredentials: true
                                });
                                likesMap[item.id] = {
                                    likes: item.likes || 0,
                                    liked: likeRes.data.liked || false
                                };
                            } catch (err) {
                                // If error, just use default values
                                likesMap[item.id] = {
                                    likes: item.likes || 0,
                                    liked: false
                                };
                            }
                        }));
                    }
                    setMenuItemLikes(likesMap);
                } else {
                    // User not logged in - just set likes counts
                    const likesMap = {};
                    menuRes.data.forEach(item => {
                        likesMap[item.id] = {
                            likes: item.likes || 0,
                            liked: false
                        };
                    });
                    setMenuItemLikes(likesMap);
                }
                
                setLoaded(true);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchRestaurantAndMenu(attempt + 1);
                } else {
                    console.error('Error fetching menu:', err);
                   // window.location.href = '/404-page.html';
                }
            }
        };

        // Only fetch if we have a valid restaurantId
        if (restaurantId) {
            fetchRestaurantAndMenu();
        } else {
            setLoaded(true); // Set loaded if no restaurantId to stop spinner
        }
    }, [restaurantId, navigate]); // Keep existing dependencies

    function changeMenuItem(m) {
        setMenuItem(m.id);
        console.log("menu = " + menuItem);
        // Use new URL format if we have restaurant data
        if (restaurantData && restaurantData.city_slug) {
            const restaurantSlug = slugify(restaurantData.name || '');
            const itemSlug = slugify(m.name || '');
            // Use new slug-based format: /restaurants/:city/:restaurant/menu/:item-slug-id
            navigate(`/restaurants/${restaurantData.city_slug}/${restaurantId}-${restaurantSlug}/menu/${itemSlug}-${m.id}`);
        } else {
            // Fallback to old format
            navigate(`/${restaurantId}/menu/item?item=${m.id}`);
        }
    }

    
    // Format price display
    const formatPrice = (price) => {
        if (price == null || price <= 0) return null;
        return Number(price).toFixed(2);
    };
    
    const getPriceDisplay = (item) => {
        const prices = [
            formatPrice(item.price),
            formatPrice(item.price2),
            formatPrice(item.price3),
            formatPrice(item.price4)
        ].filter(p => p !== null);
        
        if (prices.length === 0) return null;
        if (prices.length === 1) return `$${prices[0]}`;
        return prices.map(p => `$${p}`).join(' - ');
    };
    
    return (
        <div className="w-full">
            <div className="w-full flex flex-col sm:flex-row gap-4">
                {/* Left Column - Empty */}
                <div className="w-full sm:w-64 flex-shrink-0 sm:sticky sm:top-24 sm:self-start">
                </div>

                {/* Right Column - Heading and Menu Categories */}
                <div className="flex-1 min-w-0">
                    {loaded && restaurantData && (
                        <div className="mb-6">
                            <div className="py-4 bg-gray-800 rounded-xl">
                                <h1 className="text-2xl font-bold mb-2 text-white px-4">{restaurantData.name || restaurantName} Menu</h1>
                                {restaurantData.category && (
                                    <p className="mb-1 text-base px-4">
                                        <strong className="font-semibold text-base-content">{restaurantData.category}</strong>
                                    </p>
                                )}
                                {restaurantData.address && (
                                    <p className="mb-1 text-base text-base-content/70 px-4">
                                        {restaurantData.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {!loaded ? (
                        // Loading skeleton
                        <div className="mb-6">
                            <div className="py-4 bg-gray-800 rounded-xl">
                                <div className="h-8 bg-primary/30 rounded w-32 mb-4 mx-4 animate-pulse"></div>
                                <Carousel 
                                    id="skeleton-menu-carousel" 
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
                    ) : Object.keys(result).length === 0 ? (
                        <EmptyState
                            title="No menu items found"
                            message="This restaurant doesn't have any menu items available yet."
                            icon={<i className="bi bi-menu-button"></i>}
                        />
                    ) : (
                        Object.keys(result).map((category, categoryIndex) => (
                            <div key={categoryIndex} className="mb-6">
                                <div className="py-4 bg-gray-800 rounded-xl">
                                    <h2 className="text-2xl font-bold mb-4 text-primary px-4">{category}</h2>
                                    <Carousel
                                        id={`menu-carousel-${categoryIndex}`}
                                        scrollAmount={400}
                                        carouselClassName="px-4"
                                        aria-label={`${category} menu items carousel`}
                                    >
                                {result[category].map((data, key) => {
                                    const priceDisplay = getPriceDisplay(data);
                                    return (
                                        <CarouselItem key={data.id}>
                                            <div className="card bg-base-100 w-96 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
                                                <div className="card-body">
                                                    <h2 className="card-title">
                                                        <button
                                                            onClick={(e) => changeMenuItem(data)}
                                                            className="text-white link link-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded text-xl font-bold"
                                                        >
                                                            {data.name}
                                                        </button>
                                                        {data.category && (
                                                            <div className="badge badge-secondary badge-lg">{data.category}</div>
                                                        )}
                                                    </h2>
                                                    {data.size_display_name && (
                                                        <p className="text-base-content/70 text-sm mb-2">{data.size_display_name}</p>
                                                    )}
                                                    {priceDisplay && (
                                                        <p className="text-sm font-semibold text-base-content mb-3">
                                                            {priceDisplay}
                                                        </p>
                                                    )}
                                                    <div className="card-actions justify-end items-center">
                                                        <Link
                                                            to={restaurantData ? getMenuItemUrl(restaurantData, data) : `/${restaurantId}/menu/item?item=${data.id}`}
                                                            className="no-underline"
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                type="button"
                                                                className="min-h-[32px]"
                                                            >
                                                                View details
                                                            </Button>
                                                        </Link>
                                                        <LikeButton
                                                            itemId={data.id}
                                                            itemType="menu-item"
                                                            initialLikes={menuItemLikes[data.id]?.likes || data.likes || 0}
                                                            initialLiked={menuItemLikes[data.id]?.liked || false}
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

