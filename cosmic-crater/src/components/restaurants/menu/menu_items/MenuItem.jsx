import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios';
import QuantitySelector from '../../../users/QuantitySelector';
import currency from 'currency.js';
import { MAX_RETRY_ATTEMPTS } from '../../../App';
import Spinner from '../../../users/Spinner';
import { groupBy } from '../../RestaurantsList';
import { useParams } from 'react-router-dom';
import { saveCartToBackend } from '../../../users/cart/Cart';
import { parseRestaurantId, getRestaurantMenuUrl, slugify } from '../../../../utils/restaurantUrls';

export default function MenuItem(props) {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const { restaurant: restaurantParam, city } = params;
    const USDollar = props.USDollar;
    const debug = props.debug;
    const cart = props.cart;
    const setCart = props.setCart;
    const [restaurantData, setRestaurantData] = useState(null);
    const [restaurantName, setRestaurantName] = useState(props.restaurantName || "");
    
    // Get menuItem ID from query params or props (backward compatibility)
    const menuItemId = React.useMemo(() => {
        const itemParam = searchParams.get('item');
        if (itemParam) {
            const id = Number(itemParam);
            if (!Number.isNaN(id)) return id;
        }
        // Fallback to props for backward compatibility
        if (props.menuItem && props.menuItem > 0) return props.menuItem;
        return -1;
    }, [searchParams, props.menuItem]);
    
    // Parse restaurant ID from param or use prop
    const restaurant = React.useMemo(() => {
        if (props.restaurant && props.restaurant > 0) return props.restaurant;
        if (restaurantParam) {
            const numId = Number(restaurantParam);
            if (!Number.isNaN(numId)) return numId;
            return parseRestaurantId(restaurantParam);
        }
        return props.restaurant || -1;
    }, [restaurantParam, props.restaurant]);
    const [itemConfig, setItemConfig] = useState([]);
    const [itemIngredients, setItemIngredients] = useState([]);
    const [val1, setVal1] = useState(1);
    const [val2, setVal2] = useState(0);
    const [val3, setVal3] = useState(0);
    const [val4, setVal4] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(-1);
    const result = groupBy(itemIngredients, i => i.type);
    const [enabled, setEnabled] = useState([]);
    const [halfables, setHalfables] = useState([]);
    const [customs, setCustoms] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(true);
    const [itemName, setItemName] = useState("");
    const [sizeLabel, setSizeLabel] = useState("");
    useEffect(() => {
        const fetchMenuItem = async (attempt = 1) => {
            if (menuItemId < 0) {
                navigate("/");
                return;
            }
            console.log("menuItem: " + menuItemId);
            try {
                const res = await axios.get('/api/menu/item', { params: { menuItem: menuItemId } });
                setItemConfig(res.data);
                if (res.data[0] != undefined) {
                    const menuItem = res.data[0];
                    setPrice(menuItem.price);
                    const defaultSize = menuItem.size1 && menuItem.size1.trim().length
                        ? ` - ${menuItem.size1.trim()}`
                        : "";
                    setItemName(`${menuItem.name}${defaultSize}`);
                    setSizeLabel(menuItem.size_display_name || "");
                    
                }
                setLoading(false);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenuItem(attempt + 1);
                } else {
                    console.error('Error fetching menu item:', err);
                }
            }
        };
        const fetchMenuItemIngredients = async (attempt = 1) => {
            try {
                const res = await axios.get('/api/menu/item/ingredients', { params: { menuItem: menuItemId } });
                setItemIngredients(res.data);
                const initialEnabled = res.data.map(ingredient => ingredient.selected || false);
                setEnabled(initialEnabled);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenuItemIngredients(attempt + 1);
                } else {
                    console.error('Error fetching menu item ingredients:', err);
                }
            } finally {
                setLoading2(false);
            }
        };
        if (menuItemId > 0) {
            fetchMenuItem();
            fetchMenuItemIngredients();
        }
    }, [menuItemId, navigate, cart, setCart, setPrice, setEnabled, setHalfables, setCustoms, setVal1, setVal2, setVal3, setVal4]);

    // Fetch restaurant data for building URLs
    useEffect(() => {
        if (restaurant && restaurant > 0 && !restaurantData) {
            axios.get(`/api/public/restaurants/${restaurant}`)
                .then(res => {
                    const data = res.data;
                    setRestaurantData(data);
                    if (data.name) {
                        setRestaurantName(data.name);
                    }
                })
                .catch(err => {
                    console.error('Error fetching restaurant data:', err);
                });
        }
    }, [restaurant, restaurantData]);

    async function addToCart(e, item) {
        e.preventDefault();
        let boxes = [];
        let boxes2 = [];
        const form = e.target;
        const elements = form.elements['ingredients'];
        const customizer = form.elements['customizer'];
        const halfer = form.elements['halfer'];
        if (elements != null) {
            if (elements.length != undefined) {
                for (let i = 0; i < elements.length; i++) {
                    const v = elements[i];
                    boxes.push([v.checked, customizer[i].value]);
                    if (halfer[i] == undefined) {
                        continue;
                    }
                    boxes2.push([halfer[i].value]);
                }
            } else {
                const v = elements;
                boxes.push([v.checked, customizer.value]);
                boxes2.push([halfer.value]);
            }0
        }
        if (!Array.isArray(boxes)) boxes = [];
        if (!Array.isArray(boxes2)) boxes2 = [];
        const cartItem = {
            name: item.name,
            display_name: itemName,
            address: item.restaurantAddress,
            restaurant: restaurantName,
            restaurant_id: restaurant,
            size1: item.size1,
            val1: val1,
            size2: item.size2,
            val2: val2,
            size3: item.size3,
            val3: val3,
            size4: item.size4,
            val4: val4,
            ingredients: boxes,
            arrs: ingredientsData,
            quantity: quantity,
            price: price,
            halfer: boxes2,
        };
        cart.push(cartItem);
        setCart([...cart]);
        const profile = JSON.parse(localStorage.getItem('profile'));
        if (profile?.sub) {
            const cleanCart = cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                ingredients: item.ingredients,
                size1: item.size1,
                val1: item.val1,
                size2: item.size2,
                val2: item.val2,
                size3: item.size3,
                val3: item.val3,
                size4: item.size4,
                val4: item.val4,
                halfer: item.halfer,
                arrs: item.arrs,
                restaurant_id: item.restaurant_id
            }));
            axios.post('/api/cart', { 
                cart: cleanCart,
                userId: profile.sub 
            }).catch(error => {
                console.error('Error saving cart:', error);
            });
        }
        await saveCartToBackend(cart, profile.sub).then(() => {
            // Use new URL format if we have restaurant data
            if (restaurantData && restaurantData.city_slug) {
                const restaurantSlug = slugify(restaurantData.name || '');
                navigate(`/restaurants/${restaurantData.city_slug}/${restaurant}-${restaurantSlug}`);
            } else {
                // Fallback to old format
                navigate(`/${restaurant}/menu`);
            }
        });
    }
    const ingredientsData = [];
    function populateIngredientData() {
        for (const j in result) {
            for (const i in result[j]) {
                ingredientsData.push(result[j][i]);
            }
        }
        // Sort ingredientsData by the sort_order column
        ingredientsData.sort((a, b) => a.sort_order - b.sort_order);
    }
    let lastCategory = "";
    function setLastCategoryPrinted(v) {
        lastCategory = v;
    }
    populateIngredientData();
    function MI() {
        return (
            itemConfig.map((item, key) => {
                function calcItemTotal(uu) {
                    // Start with base price of 0
                    let configPrice = currency(0);
                    
                    // Process each ingredient's price contribution
                    ingredientsData.forEach((ingredient, key) => {
                        // Only calculate for enabled ingredients
                        if (enabled[key] === true) {
                            // Determine price based on customization (Extra, Easy, Regular)
                            let ingredientPrice = currency(0);
                            
                            if (customs[key] === "Extra") {
                                ingredientPrice = currency(ingredient.extra_price);
                            } else if (customs[key] === "Easy") {
                                ingredientPrice = currency(ingredient.easy_price);
                            } else {
                                // Regular price
                                ingredientPrice = currency(ingredient.price);
                            }
                            
                            // Apply half-price calculation if ingredient is only on half the item
                            const isHalfItem = halfables[key] === "Right Half" || halfables[key] === "Left Half";
                            if (isHalfItem) {
                                ingredientPrice = ingredientPrice.divide(2);
                            }
                            
                            // Add to running total
                            configPrice = configPrice.add(ingredientPrice.value);
                        }
                    });
                    
                    // Add base item price according to size selection (uu)
                    const itemSizePrice = uu === 1 ? item.price : 
                                         uu === 2 ? item.price2 : 
                                         uu === 3 ? item.price3 : 
                                         uu === 4 ? item.price4 : item.price;
                    
                    // Update the final price
                    setPrice(configPrice.add(itemSizePrice).value);
                }
                function itemTotal() {
                    if (val1 == 1) {
                        calcItemTotal(1);
                    } else if (val2 == 1) {
                        calcItemTotal(2);
                    } else if (val3 == 1) {
                        calcItemTotal(3);
                    } else if (val4 == 1) {
                        calcItemTotal(4);
                    }
                }
                useEffect(()=>{
                    itemTotal();
                }, [val1, val2, val3, val4])

                const resolveNameForSize = (menuItem, index) => {
                    const sizeKey = `size${index}`;
                    const sizeValue = menuItem[sizeKey];
                    if (sizeValue && sizeValue.trim().length) {
                        return `${menuItem.name} - ${sizeValue.trim()}`;
                    }
                    return menuItem.name;
                };

                function changeRadio1(e) {
                    setVal1(1);
                    setVal2(0);
                    setVal3(0);
                    setVal4(0);
                    calcItemTotal(1);
                    setItemName(resolveNameForSize(item, 1));
                }
                function changeRadio2(e) {
                    setVal1(0);
                    setVal2(1);
                    setVal3(0);
                    setVal4(0);
                    calcItemTotal(2);
                    setItemName(resolveNameForSize(item, 2));
                }
                function changeRadio3(e) {
                    setVal1(0);
                    setVal2(0);
                    setVal3(1);
                    setVal4(0);
                    calcItemTotal(3);
                    setItemName(resolveNameForSize(item, 3));
                }
                function changeRadio4(e) {
                    setVal1(0);
                    setVal2(0);
                    setVal3(0);
                    setVal4(1);
                    calcItemTotal(4);
                    setItemName(resolveNameForSize(item, 4));
                }
                return (
                    <form key={key} onSubmit={(e) => addToCart(e, item)}>
                        <div className="flex flex-wrap">
                            <div className="w-full text-center">
                                <h2>{itemName}</h2>
                                {sizeLabel && (
                                    <p className="text-gray-500 mb-0">{sizeLabel}</p>
                                )}
                                <h3>
                                    <p>
                                        <b className="text-green-600">
                                            {USDollar.format(price)}
                                        </b>
                                    </p>
                                </h3>
                            </div>
                        </div>
                        <div className="flex flex-wrap">
                            <div className="w-full md:w-1/2">
                                <div>
                                    <h5 className="m-1">
                                        <span className="text-red-600">*</span>
                                        Size
                                    </h5>
                                    {(item.size1 != null && item.size1 != "") ? (
                                        <div className="p-3 m-1 bg-gray-900 text-white rounded">
                                            <label>
                                                <input
                                                    required
                                                    type="radio"
                                                    checked={val1}
                                                    onChange={(e) => changeRadio1(e)}
                                                    name="itemSize"
                                                />
                                                <span> </span>
                                                {item.size1} {debug ? val1 : ""}
                                            </label>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {(item.size2 != null && item.size2 != "") ? (
                                        <div className="p-3 m-1 bg-gray-900 text-white rounded">
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={val2}
                                                    onChange={(e) => changeRadio2(e)}
                                                    name="itemSize"
                                                />
                                                <span> </span>
                                                {item.size2} {debug ? val2 : ""}
                                            </label>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {(item.size3 != null && item.size3 != "") ? (
                                        <div className="p-3 m-1 bg-gray-900 text-white rounded">
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={val3}
                                                    onChange={(e) => changeRadio3(e)}
                                                    name="itemSize"
                                                />
                                                <span> </span>
                                                {item.size3} {debug ? val3 : ""}
                                            </label>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {(item.size4 != null && item.size4 != "") ? (
                                        <div className="p-3 m-1 bg-gray-900 text-white rounded">
                                            <label>
                                                <input
                                                    type="radio"
                                                    checked={val4}
                                                    onChange={(e) => changeRadio4(e)}
                                                    name="itemSize"
                                                />
                                                <span> </span>
                                                {item.size4} {debug ? val4 : ""}
                                            </label>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>
                            <div className="w-full md:w-1/2">
                                {console.log(ingredientsData)}
                                {!loading2 ? (
                                    ingredientsData.map((q, key) => {
                                        function changeEnabledRadio(e) {
                                            // Create a new array to properly update state
                                            const newEnabled = [...enabled];
                                            // Find all elements of the same type
                                            for (let i = 0; i < ingredientsData.length; i++) {
                                                if (ingredientsData[i]['type'] === q['type']) {
                                                    // Set only the clicked one to true, others to false
                                                    newEnabled[i] = (i === key);
                                                }
                                            }
                                            // Update state with the new array
                                            setEnabled(newEnabled);
                                            //itemTotal();
                                        }
                                        function changeEnabledCheckbox(e) {
                                            enabled[key] = !enabled[key];
                                            console.log(key + " " + enabled[key]);
                                            setEnabled(enabled.map((e) => e));
                                            itemTotal();
                                        }
                                        function changeHalfer(e) {
                                            console.log("[[ " + e.target.value + " " + e.target.id);
                                            halfables[key] = e.target.value;
                                            console.log("]]" + halfables[key]);
                                            itemTotal();
                                        }
                                        function changeCustomizer(e) {
                                            console.log("[[ " + e.target.value + " " + e.target.id);
                                            
                                            // Create a new copy of the customs object
                                            const updatedCustoms = { ...customs };
                                            updatedCustoms[key] = e.target.value;
                                            
                                            // Update the state with the new object
                                            setCustoms(updatedCustoms); // Assuming you have a state setter function
                                            
                                            console.log("]]" + updatedCustoms[key]);
                                            itemTotal();
                                        }
                                        return ingredientsData ? (
                                            <div key={key}>
                                                {lastCategory != q['type'] ? (
                                                    <h5 className="m-1">
                                                        {q['inputType'] == 1 ? (
                                                            <span className="text-red-600">*</span>
                                                        ) : (
                                                            ""
                                                        )}
                                                        {q['type']}
                                                    </h5>
                                                ) : (
                                                    ""
                                                )}
                                                {setLastCategoryPrinted(q['type'])}
                                                <div className="p-3 m-1 bg-gray-900 text-white rounded">
                                                    <div className="flex flex-wrap">
                                                        <div className="w-full lg:w-1/2">
                                                            {q['inputType'] == 0 ? (
                                                                <label>
                                                                    <input
                                                                        onChange={(e) => changeEnabledCheckbox(e)}
                                                                        type="checkbox"
                                                                        id="ingredients"
                                                                        defaultChecked={enabled[key] ? true : false}
                                                                        name={q['type']}
                                                                    />
                                                                    <span> </span>
                                                                    <span>{q['ingredients_name']}</span>
                                                                </label>
                                                            ) : (
                                                                <label>
                                                                    <input
                                                                        required
                                                                        onChange={(e) => changeEnabledRadio(e)}
                                                                        type="radio"
                                                                        id="ingredients"
                                                                        defaultChecked={enabled[key] ? true : false}
                                                                        name={q['type']}
                                                                    />
                                                                    <span> </span>
                                                                    <span>{q['ingredients_name']}</span>
                                                                </label>
                                                            )}
                                                        </div>
                                                        <div className="w-full lg:w-1/2 text-right">
                                                            <div>
                                                                <select
                                                                    disabled={enabled[key] == false ? "disabled" : null}
                                                                    style={{
                                                                        visibility:
                                                                            q['customize'] == 0 || q['halfable'] == 0
                                                                                ? "hidden"
                                                                                : "visible",
                                                                    }}
                                                                    onChange={(e) => changeHalfer(e)}
                                                                    className="middle"
                                                                    name="halfer"
                                                                    defaultValue={halfables[key] || "Whole"}
                                                                    id={key}
                                                                >
                                                                    <option value="Left Half">Left half</option>
                                                                    <option value="Whole">Whole</option>
                                                                    <option value="Right Half">Right half</option>
                                                                </select>
                                                                <span> </span>
                                                                <select
                                                                    disabled={enabled[key] == false ? "disabled" : null}
                                                                    style={{
                                                                        visibility: q['customize'] == 0 ? "hidden" : "visible",
                                                                    }}
                                                                    onChange={(e) => changeCustomizer(e)}
                                                                    className="middle"
                                                                    name="customizer"
                                                                    value={customs[key] || 'Regular'}
                                                                    id={q['type']}
                                                                >
                                                                    <option value="Easy">Easy</option>
                                                                    <option value="Regular">Regular</option>
                                                                    <option value="Extra">Extra</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Spinner />
                                        );
                                    })
                                ) : (
                                    <Spinner />
                                )}
                                <div className="w-full flex flex-col md:flex-row gap-2 justify-center items-center m-1">
                                    <div className="flex justify-center">
                                        <QuantitySelector
                                            className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            inputValue={quantity}
                                            onInputValueChange={setQuantity}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <input
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors text-lg font-semibold"
                                            value={"Add " + quantity + " to cart"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                );
            })
        )
    }
    return (
        <div className="mx-auto">
            <button className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors text-lg mb-4" onClick={(e) => {
                // Use new URL format if we have restaurant data
                if (restaurantData && restaurantData.city_slug) {
                    const restaurantSlug = slugify(restaurantData.name || '');
                    navigate(`/restaurants/${restaurantData.city_slug}/${restaurant}-${restaurantSlug}`);
                } else {
                    // Fallback to old format
                    navigate(`/${restaurant}/menu`);
                }
            }}>
                <i className="bi bi-arrow-return-left"></i> {restaurantName != undefined ? restaurantName : "Back"}
            </button>
            {loading ? (
                <div className="flex flex-wrap text-center">
                    <div className="w-full">
                        <Spinner />
                    </div>
                </div>
            ) : (
                <MI />
            )}
        </div>
    );
}