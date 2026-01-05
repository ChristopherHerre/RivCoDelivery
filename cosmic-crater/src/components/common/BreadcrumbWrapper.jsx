import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseRestaurantId } from '../../utils/restaurantUrls';
import { generateBreadcrumbJsonLd } from '../../utils/breadcrumbUtils';
import Button from './Button';

/**
 * BreadcrumbWrapper component that generates breadcrumbs based on the current route
 * This component is placed in the Layout above the white-area
 */
export default function BreadcrumbWrapper() {
    const location = useLocation();
    const navigate = useNavigate();
    const [breadcrumbItems, setBreadcrumbItems] = useState([]);
    const jsonLdScriptRef = useRef(null);

    // Inject JSON-LD structured data for SEO
    useEffect(() => {
        // Remove existing breadcrumb JSON-LD script if it exists
        if (jsonLdScriptRef.current) {
            jsonLdScriptRef.current.remove();
            jsonLdScriptRef.current = null;
        }

        // Generate and inject JSON-LD if we have breadcrumbs
        if (breadcrumbItems.length > 0) {
            const baseUrl = window.location.origin;
            const jsonLd = generateBreadcrumbJsonLd(breadcrumbItems, baseUrl);
            
            if (jsonLd && Object.keys(jsonLd).length > 0) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.textContent = JSON.stringify(jsonLd);
                script.id = 'breadcrumb-json-ld';
                document.head.appendChild(script);
                jsonLdScriptRef.current = script;
            }
        }

        // Cleanup: remove script on unmount or when breadcrumbs change
        return () => {
            if (jsonLdScriptRef.current) {
                jsonLdScriptRef.current.remove();
                jsonLdScriptRef.current = null;
            }
        };
    }, [breadcrumbItems]);

    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathname = location.pathname;
            const items = [];

            // Home is always first
            items.push({ label: 'Home', href: '/' });

            // Check if we're on a restaurant-related route
            if (pathname.startsWith('/restaurants/')) {
                const pathParts = pathname.split('/').filter(Boolean);
                
                // pathParts[0] = 'restaurants'
                // pathParts[1] = city slug
                // pathParts[2] = restaurant slug (id-slug format)
                // pathParts[3] = optional: 'menu', 'cart', 'checkout', 'categories', 'ingredients'
                // pathParts[4] = optional: item slug, category slug, ingredient slug

                if (pathParts.length >= 2) {
                    const citySlug = pathParts[1];
                    
                    // Fetch city name
                    try {
                        const citiesRes = await axios.get('/api/restaurant-cities');
                        const city = citiesRes.data.find(c => c.city_slug === citySlug);
                        const cityName = city?.city_name || citySlug;
                        items.push({ label: cityName, href: `/restaurants/${citySlug}` });
                    } catch (err) {
                        items.push({ label: citySlug, href: `/restaurants/${citySlug}` });
                    }

                    if (pathParts.length >= 3) {
                        const restaurantSlug = pathParts[2];
                        const restaurantId = parseRestaurantId(restaurantSlug);
                        
                        if (restaurantId) {
                            try {
                                const restaurantRes = await axios.get(`/api/public/restaurants/${restaurantId}`);
                                const restaurant = restaurantRes.data;
                                const restaurantName = restaurant?.name || restaurantSlug;
                                
                                // Check what comes after restaurant
                                if (pathParts.length === 3 || pathParts[3] === '') {
                                    // Just restaurant page
                                    items.push({ label: restaurantName });
                                } else if (pathParts[3] === 'categories') {
                                    // Category page
                                    const categorySlug = pathParts[4];
                                    if (categorySlug) {
                                        // Try to get category name from API or use slug
                                        const categoryName = categorySlug.split('-').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ');
                                        items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                        items.push({ label: categoryName });
                                    } else {
                                        items.push({ label: restaurantName });
                                    }
                                } else if (pathParts[3] === 'menu') {
                                    // Menu item page
                                    const itemSlug = pathParts[4];
                                    if (itemSlug && itemSlug !== 'item') {
                                        // Parse item ID from slug (format: item-slug-id)
                                        const itemId = itemSlug.split('-').pop();
                                        if (itemId && !isNaN(itemId)) {
                                            try {
                                                const menuRes = await axios.get(`/api/restaurants2/${restaurantId}/menu`);
                                                const menuItem = menuRes.data.find(item => item.id === Number(itemId));
                                                const itemName = menuItem?.name || itemSlug;
                                                items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                                items.push({ label: itemName });
                                            } catch (err) {
                                                items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                                items.push({ label: itemSlug });
                                            }
                                        } else {
                                            items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                            items.push({ label: 'Menu Item' });
                                        }
                                    } else {
                                        // Just menu page (shouldn't happen with new routes, but handle it)
                                        items.push({ label: restaurantName });
                                    }
                                } else if (pathParts[3] === 'cart') {
                                    items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                    items.push({ label: 'Cart' });
                                } else if (pathParts[3] === 'checkout') {
                                    items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                    items.push({ label: 'Checkout' });
                                } else if (pathParts[3] === 'ingredients') {
                                    const ingredientSlug = pathParts[4];
                                    if (ingredientSlug) {
                                        const ingredientName = ingredientSlug.split('-').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ');
                                        items.push({ label: restaurantName, href: `/restaurants/${citySlug}/${restaurantSlug}` });
                                        items.push({ label: ingredientName });
                                    } else {
                                        items.push({ label: restaurantName });
                                    }
                                } else {
                                    items.push({ label: restaurantName });
                                }
                            } catch (err) {
                                // If restaurant fetch fails, just use the slug
                                items.push({ label: restaurantSlug });
                            }
                        }
                    }
                }
            }

            // Only show breadcrumbs if we have more than just "Home"
            setBreadcrumbItems(items.length > 1 ? items : []);
        };

        generateBreadcrumbs();
    }, [location.pathname]);

    // Don't render if no breadcrumbs or still loading initial data
    if (breadcrumbItems.length === 0) {
        return null;
    }

    // Render breadcrumb HTML with styled links and proper contrast
    return (
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <ol className="breadcrumb-list flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;
                    const isLink = item.href && !isLast;
                    
                    return (
                        <li key={index} className="breadcrumb-item flex items-center gap-2">
                            {isLink ? (
                                <Button
                                    variant="light"
                                    size="sm"
                                    type="button"
                                    onClick={() => navigate(item.href)}
                                    className="whitespace-nowrap max-[320px]:!px-1.5 max-[320px]:!py-0.5 max-[320px]:!text-xs"
                                >
                                    {item.label}
                                </Button>
                            ) : (
                                <span 
                                    className="breadcrumb-current text-white font-semibold" 
                                    aria-current="page"
                                >
                                    {item.label}
                                </span>
                            )}
                            {!isLast && (
                                <svg 
                                    className="breadcrumb-separator text-secondary/50" 
                                    aria-hidden="true" 
                                    viewBox="0 0 16 16" 
                                    fill="currentColor"
                                    width="16"
                                    height="16"
                                >
                                    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0L10.94 8a.75.75 0 0 1 0 1.06l-3.66 3.78a.75.75 0 1 1-1.06-1.06L9.38 8.5 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
