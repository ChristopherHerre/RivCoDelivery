import React, { useEffect, useState } from 'react';
import ResponsiveFlexRow from '../../common/ResponsiveFlexRow';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Spinner from '../../users/Spinner';
import { groupBy } from '../RestaurantsList';
import { useParams } from 'react-router-dom';
import { parseRestaurantId, getRestaurantMenuItemUrl, slugify, getMenuItemUrl } from '../../../utils/restaurantUrls';

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
            {loaded && (
                <>
                    {restaurantData && (
                        <nav className="mb-4 text-sm text-gray-600">
                            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
                            <span className="mx-2">/</span>
                            <Link to={`/restaurants/${city}`} className="text-blue-600 hover:underline">{restaurantData.city_name || city}</Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900">{restaurantData.name || restaurantName}</span>
                        </nav>
                    )}
                    <header className="mb-6">
                        {restaurantData ? (
                            <>
                                <h1 className="mb-2 text-2xl font-semibold text-gray-900">{restaurantData.name || restaurantName}</h1>
                                {restaurantData.category && (
                                    <p className="mb-1 text-base">
                                        <strong className="font-semibold text-gray-900">{restaurantData.category}</strong>
                                    </p>
                                )}
                                {restaurantData.address && (
                                    <p className="mb-1 text-base text-gray-700">{restaurantData.address}</p>
                                )}
                                {restaurantData.city_name && (
                                    <p className="text-gray-600 mb-4 text-base">{restaurantData.city_name}</p>
                                )}
                            </>
                        ) : (
                            <h2 className="mb-4 text-2xl font-semibold text-gray-900">{restaurantName} Menu</h2>
                        )}
                    </header>
                </>
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
                                        <article className="border border-gray-600 rounded-lg shadow-sm bg-gray-900 h-full flex flex-col hover:shadow-md transition-shadow">
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="text-lg font-semibold mb-1">
                                                    <button
                                                        onClick={(e) => changeMenuItem(data)}
                                                        className="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors"
                                                    >
                                                        {data.name}
                                                    </button>
                                                </h3>
                                                {data.size_display_name && (
                                                    <p className="text-sm text-gray-300 mb-2">{data.size_display_name}</p>
                                                )}
                                                {priceDisplay && (
                                                    <ResponsiveFlexRow className="mt-auto pt-2 border-t border-gray-700">
                                                        <span className="font-bold text-lg text-white">
                                                            {priceDisplay}
                                                        </span>
                                                        <Link
                                                            to={restaurantData ? getMenuItemUrl(restaurantData, data) : `/${restaurantId}/menu/item?item=${data.id}`}
                                                            className="inline-block px-3 py-1.5 bg-blue-600 text-white text-sm font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer"
                                                        >
                                                            View details
                                                        </Link>
                                                    </ResponsiveFlexRow>
                                                )}
                                            </div>
                                        </article>
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

