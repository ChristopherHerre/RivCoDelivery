import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Spinner from '../../users/Spinner';
import { groupBy } from '../RestaurantsList';
import { useParams } from 'react-router-dom';
import { parseRestaurantId, getRestaurantMenuItemUrl, slugify } from '../../../utils/restaurantUrls';

export default function Menu(props) {
    const params = useParams();
    const { restaurant: restaurantParam, city } = params;
    const menuItem = props.menuItem;
    const setMenuItem = props.setMenuItem;
    const [restaurantName, setRestaurantName] = useState(props.restaurantName || "");
    const [restaurantData, setRestaurantData] = useState(null);
    const [menu, setMenu] = useState([]);
    const navigate = useNavigate();
    const result = groupBy(menu, r => r.category);
    const [loaded, setLoaded] = useState(false);

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
            navigate(`/restaurants/${restaurantData.city_slug}/${restaurantId}-${restaurantSlug}/menu/item?item=${m.id}`);
        } else {
            // Fallback to old format
            navigate(`/${restaurantId}/menu/item?item=${m.id}`);
        }
    }

    let lastCategory = "";
    function setLastCategoryPrinted(v) {
        lastCategory = v;
    }

    const menuData = [];
    function populateMenuData() {
        for (const j in result) {
            for (const i in result[j]) {
                menuData.push(result[j][i]);
            }
        }
    }
    populateMenuData();
    return (
        <>
            <Link to="/">
                <button className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors text-lg m-1">
                    <i className="bi bi-arrow-return-left"></i> Back
                </button>
            </Link>
            {loaded ? <h2 className="m-1">{restaurantName} Menu</h2> : ""}
            {
                loaded ? Object.keys(result).map((category, categoryIndex) => (
                    <span key={categoryIndex}>
                        <div className="flex flex-wrap">
                            {result[category].map((data, key) => {
                                const isNewCategory = data.category != null && lastCategory != data.category;
                                if (isNewCategory) {
                                    setLastCategoryPrinted(data.category);
                                }
                                return (
                                    <React.Fragment key={data.id}>
                                        {isNewCategory &&
                                        <h5 className="pl-4">
                                            {data.category}
                                        </h5>}
                                        <div className={"w-full md:w-1/2 xl:w-1/3"} key={data.id}>
                                            <div className="m-1">
                                                <button
                                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                                        onClick={(e) => changeMenuItem(data)}>
                                                    {data.name}
                                                    <span> - $</span>
                                                    {data.price != null && data.price > 0 &&
                                                    <span className="font-bold">
                                                        {data.price}
                                                    </span>}
                                                    {data.price2 != null && data.price2 > 0 && <span> - $</span>}
                                                    {data.price2 != null && data.price2 > 0 &&
                                                    <span className="font-bold">
                                                        {data.price2}
                                                    </span>}
                                                    {data.price3 != null && data.price3 > 0 && <span> - $</span>}
                                                    {data.price3 != null && data.price3 > 0 &&
                                                    <span className="font-bold">
                                                        {data.price3}
                                                    </span>}
                                                    {data.price4 != null && data.price4 > 0 && <span> - $</span>}
                                                    {data.price4 != null && data.price4 > 0 &&
                                                    <span className="font-bold">
                                                        {data.price4}
                                                    </span>}
                                                </button>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </span>
                ))
                : 
                (<Spinner />)
            }
        </>
    );
}

