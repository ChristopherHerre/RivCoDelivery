import React, { useEffect, useState } from 'react';
import ResponsiveFlexRow from '../../common/ResponsiveFlexRow';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Spinner from '../../users/Spinner';
import { groupBy } from '../RestaurantsList';
import { useParams } from 'react-router-dom';
import { parseRestaurantId, getRestaurantMenuItemUrl, slugify, getMenuItemUrl } from '../../../utils/restaurantUrls';
import LikeButton from '../../common/LikeButton';
import Button from '../../common/Button';

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
        <div className="mx-auto">
            {loaded && restaurantData && (
                <ResponsiveFlexRow margin="mb-6" align="stretch" variant="restaurant">
                    <div className="flex-1 flex flex-col">
                        <h1 className="mb-2 text-2xl font-semibold text-white">{restaurantData.name || restaurantName} Menu</h1>
                        {restaurantData.category && (
                            <p className="mb-1 text-base">
                                <strong className="font-semibold text-white">{restaurantData.category}</strong>
                            </p>
                        )}
                        {restaurantData.address && (
                            <p className="mb-1 text-base text-white/90">{restaurantData.address}</p>
                        )}
                    </div>
                </ResponsiveFlexRow>
            )}
            
            {
                loaded ? Object.keys(result).map((category, categoryIndex) => (
                    <section className="mb-6" key={categoryIndex}>
                        <h2 className="text-xl font-semibold mb-3 text-gray-900">{category}</h2>
                        <div className="flex flex-wrap -mx-3">
                            {result[category].map((data, key) => {
                                const priceDisplay = getPriceDisplay(data);
                                return (
                                    <div className="w-full md:w-1/2 px-3 mb-3" key={data.id}>
                                        <ResponsiveFlexRow card vertical align="stretch" variant="menu">
                                            <div className="flex-1 flex flex-col">
                                                <h3 className="text-lg font-semibold mb-2">
                                                    <button
                                                        onClick={(e) => changeMenuItem(data)}
                                                        className="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors"
                                                    >
                                                        {data.name}
                                                    </button>
                                                </h3>
                                                {data.category && (
                                                    <p className="text-sm text-white/80 mb-2">{data.category}</p>
                                                )}
                                                {data.size_display_name && (
                                                    <p className="text-sm text-white/80 mb-2">{data.size_display_name}</p>
                                                )}
                                                {priceDisplay && (
                                                    <ResponsiveFlexRow borderTop margin="mt-auto" variant="nested">
                                                        <span className="font-bold text-lg text-white">
                                                            {priceDisplay}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                to={restaurantData ? getMenuItemUrl(restaurantData, data) : `/${restaurantId}/menu/item?item=${data.id}`}
                                                                className="no-underline"
                                                            >
                                                                <Button
                                                                    size="md-large"
                                                                    responsiveFullWidth={true}
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
                                                    </ResponsiveFlexRow>
                                                )}
                                            </div>
                                        </ResponsiveFlexRow>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )) : (
                    <Spinner />
                )
            }
        </div>
    );
}

