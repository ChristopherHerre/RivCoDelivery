import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../../../users/Spinner';
import { dbPost } from '../../Admin';
import { getTooltip } from './ingredients/NewIngredient';
import Button from '../../../common/Button';
import axios from 'axios';
function NewMenuItem(props) {
    const setMenuItems = props.setMenuItems;
    const setLoading3 = props.setLoading3;
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        size1: 'Regular',
        price2: '',
        size2: '',
        price3: '',
        size3: '',
        price4: '',
        size4: '',
        sort: 2
    });
    const [categorySuggestions, setCategorySuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const categoryInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Add price autocomplete state
    const [priceSuggestions, setPriceSuggestions] = useState({
        price: [],
        price2: [],
        price3: [],
        price4: []
    });
    const [showPriceSuggestions, setShowPriceSuggestions] = useState({
        price: false,
        price2: false,
        price3: false,
        price4: false
    });
    const [loadingPriceSuggestions, setLoadingPriceSuggestions] = useState({
        price: false,
        price2: false,
        price3: false,
        price4: false
    });
    const priceInputRefs = {
        price: useRef(null),
        price2: useRef(null),
        price3: useRef(null),
        price4: useRef(null)
    };
    const priceSuggestionsRefs = {
        price: useRef(null),
        price2: useRef(null),
        price3: useRef(null),
        price4: useRef(null)
    };

    // Add size autocomplete state
    const [sizeSuggestions, setSizeSuggestions] = useState({
        size1: [],
        size2: [],
        size3: [],
        size4: []
    });
    const [showSizeSuggestions, setShowSizeSuggestions] = useState({
        size1: false,
        size2: false,
        size3: false,
        size4: false
    });
    const [loadingSizeSuggestions, setLoadingSizeSuggestions] = useState({
        size1: false,
        size2: false,
        size3: false,
        size4: false
    });
    const sizeInputRefs = {
        size1: useRef(null),
        size2: useRef(null),
        size3: useRef(null),
        size4: useRef(null)
    };
    const sizeSuggestionsRefs = {
        size1: useRef(null),
        size2: useRef(null),
        size3: useRef(null),
        size4: useRef(null)
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Fetch suggestions for category field
        if (name === 'category' && value.length > 0) {
            fetchCategorySuggestions(value);
            setShowSuggestions(true);
        } else if (name === 'category' && value.length === 0) {
            setShowSuggestions(false);
            setCategorySuggestions([]);
        }
        
        // Fetch suggestions for price fields
        if (['price', 'price2', 'price3', 'price4'].includes(name) && value.length > 0) {
            fetchPriceSuggestions(name, value);
            setShowPriceSuggestions(prev => ({ ...prev, [name]: true }));
        } else if (['price', 'price2', 'price3', 'price4'].includes(name) && value.length === 0) {
            setShowPriceSuggestions(prev => ({ ...prev, [name]: false }));
            setPriceSuggestions(prev => ({ ...prev, [name]: [] }));
        }
        
        // Fetch suggestions for size fields
        if (['size1', 'size2', 'size3', 'size4'].includes(name) && value.length > 0) {
            fetchSizeSuggestions(name, value);
            setShowSizeSuggestions(prev => ({ ...prev, [name]: true }));
        } else if (['size1', 'size2', 'size3', 'size4'].includes(name) && value.length === 0) {
            setShowSizeSuggestions(prev => ({ ...prev, [name]: false }));
            setSizeSuggestions(prev => ({ ...prev, [name]: [] }));
        }
    };

    const fetchCategorySuggestions = async (query) => {
        if (!query || query.trim().length === 0) {
            setCategorySuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        try {
            const response = await axios.get('/api/menu-item-categories', {
                params: { query },
                withCredentials: true
            });
            setCategorySuggestions(response.data);
        } catch (err) {
            console.error('Error fetching category suggestions:', err);
            setCategorySuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const fetchPriceSuggestions = async (field, query) => {
        if (!query || query.trim().length === 0) {
            setPriceSuggestions(prev => ({ ...prev, [field]: [] }));
            return;
        }
        setLoadingPriceSuggestions(prev => ({ ...prev, [field]: true }));
        try {
            const response = await axios.get('/api/menu-item-prices', {
                params: { query, field },
                withCredentials: true
            });
            setPriceSuggestions(prev => ({ ...prev, [field]: response.data }));
        } catch (err) {
            console.error('Error fetching price suggestions:', err);
            setPriceSuggestions(prev => ({ ...prev, [field]: [] }));
        } finally {
            setLoadingPriceSuggestions(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleCategorySelect = (category) => {
        setFormData({ ...formData, category });
        setShowSuggestions(false);
        setCategorySuggestions([]);
    };

    const handlePriceSelect = (field, price) => {
        setFormData({ ...formData, [field]: price });
        setShowPriceSuggestions(prev => ({ ...prev, [field]: false }));
        setPriceSuggestions(prev => ({ ...prev, [field]: [] }));
    };

    const fetchSizeSuggestions = async (field, query) => {
        if (!query || query.trim().length === 0) {
            setSizeSuggestions(prev => ({ ...prev, [field]: [] }));
            return;
        }
        setLoadingSizeSuggestions(prev => ({ ...prev, [field]: true }));
        try {
            const response = await axios.get('/api/menu-item-sizes', {
                params: { query, field },
                withCredentials: true
            });
            setSizeSuggestions(prev => ({ ...prev, [field]: response.data }));
        } catch (err) {
            console.error('Error fetching size suggestions:', err);
            setSizeSuggestions(prev => ({ ...prev, [field]: [] }));
        } finally {
            setLoadingSizeSuggestions(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSizeSelect = (field, size) => {
        setFormData({ ...formData, [field]: size });
        setShowSizeSuggestions(prev => ({ ...prev, [field]: false }));
        setSizeSuggestions(prev => ({ ...prev, [field]: [] }));
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check category
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target) &&
                categoryInputRef.current &&
                !categoryInputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
            
            // Check all price fields
            ['price', 'price2', 'price3', 'price4'].forEach(field => {
                if (
                    priceSuggestionsRefs[field].current &&
                    !priceSuggestionsRefs[field].current.contains(event.target) &&
                    priceInputRefs[field].current &&
                    !priceInputRefs[field].current.contains(event.target)
                ) {
                    setShowPriceSuggestions(prev => ({ ...prev, [field]: false }));
                }
            });
            
            // Check all size fields
            ['size1', 'size2', 'size3', 'size4'].forEach(field => {
                if (
                    sizeSuggestionsRefs[field].current &&
                    !sizeSuggestionsRefs[field].current.contains(event.target) &&
                    sizeInputRefs[field].current &&
                    !sizeInputRefs[field].current.contains(event.target)
                ) {
                    setShowSizeSuggestions(prev => ({ ...prev, [field]: false }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    async function submitMenuItem(e) {
        e.preventDefault();
        setLoading(true);
        const inputs = { ...formData, restaurant_id: null }; 
        try {
            const response = await dbPost(e, e.target, inputs, "add-menu-item");
            if (response.status >= 200 && response.status < 300) {
                setSuccess(true);
                setLoading3(true);
                setFormData({
                    name: '',
                    category: '',
                    price: '',
                    size1: 'Regular',
                    price2: '',
                    size2: '',
                    price3: '',
                    size3: '',
                    price4: '',
                    size4: '',
                    sort: 2
                });
                setShowSuggestions(false);
                setCategorySuggestions([]);
                setShowPriceSuggestions({ price: false, price2: false, price3: false, price4: false });
                setPriceSuggestions({ price: [], price2: [], price3: [], price4: [] });
                setShowSizeSuggestions({ size1: false, size2: false, size3: false, size4: false });
                setSizeSuggestions({ size1: [], size2: [], size3: [], size4: [] });
                setTimeout(() => setSuccess(false), 2000);
            }
        } catch (err) {
            console.error("Error submitting menu item:", err);
            setError(err.message);
            setTimeout(() => {
                setError("");
            }, 2000);
        } finally {
            setLoading(false);
        }
    }
    return (
        <form onSubmit={submitMenuItem} className="flex flex-wrap shadow-lg rounded-xl bg-gray-900 text-white p-4">
            <h3 className="text-white w-full mb-4">Add New Menu Item</h3>
            <div className="w-full md:w-1/4 mb-4 md:pr-2">
                <b className="text-white block mb-2">Name:</b>
                <div className="group relative">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    {getTooltip("name") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("name")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4 mb-4 md:px-1">
                <b className="text-white block mb-2">Category:</b>
                <div className="group relative">
                    <input
                        ref={categoryInputRef}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        onFocus={() => {
                            if (formData.category.length > 0) {
                                fetchCategorySuggestions(formData.category);
                                setShowSuggestions(true);
                            }
                        }}
                        autoComplete="off"
                        required
                    />
                    {getTooltip("category") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("category")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                    {showSuggestions && categorySuggestions.length > 0 && (
                        <div
                            ref={suggestionsRef}
                            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {loadingSuggestions ? (
                                <div className="px-4 py-2 text-white text-sm">Loading...</div>
                            ) : (
                                categorySuggestions.map((category, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
                                        onClick={() => handleCategorySelect(category)}
                                    >
                                        {category}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4 mb-4 md:px-1">
                <b className="text-white block mb-2">Sort:</b>
                <div className="group relative">
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="sort"
                        value={formData.sort}
                        onChange={handleChange}
                        required
                    />
                    {getTooltip("sort") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("sort")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4 mb-4 md:pl-2">
                <b className="text-white block mb-2">Price:</b>
                <div className="group relative">
                    <input
                        ref={priceInputRefs.price}
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        onFocus={() => {
                            if (formData.price.length > 0) {
                                fetchPriceSuggestions('price', formData.price);
                                setShowPriceSuggestions(prev => ({ ...prev, price: true }));
                            }
                        }}
                        autoComplete="off"
                        required
                    />
                    {getTooltip("price") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("price")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                    {showPriceSuggestions.price && priceSuggestions.price.length > 0 && (
                        <div
                            ref={priceSuggestionsRefs.price}
                            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {loadingPriceSuggestions.price ? (
                                <div className="px-4 py-2 text-white text-sm">Loading...</div>
                            ) : (
                                priceSuggestions.price.map((price, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
                                        onClick={() => handlePriceSelect('price', price)}
                                    >
                                        {price}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Size and Price Fields */}
            {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                    <div className="w-full md:w-1/4 mb-4 md:pr-2">
                        <b className="text-white block mb-2">Size{num}:</b>
                        <div className="group relative">
                            <input
                                ref={sizeInputRefs[`size${num}`]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                name={`size${num}`}
                                value={formData[`size${num}`]}
                                onChange={handleChange}
                                onFocus={() => {
                                    const fieldName = `size${num}`;
                                    if (formData[fieldName] && formData[fieldName].length > 0) {
                                        fetchSizeSuggestions(fieldName, formData[fieldName]);
                                        setShowSizeSuggestions(prev => ({ ...prev, [fieldName]: true }));
                                    }
                                }}
                                autoComplete="off"
                            />
                            {getTooltip(`size${num}`) && (
                                <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                    {getTooltip(`size${num}`)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                            {showSizeSuggestions[`size${num}`] && sizeSuggestions[`size${num}`].length > 0 && (
                                <div
                                    ref={sizeSuggestionsRefs[`size${num}`]}
                                    className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                >
                                    {loadingSizeSuggestions[`size${num}`] ? (
                                        <div className="px-4 py-2 text-white text-sm">Loading...</div>
                                    ) : (
                                        sizeSuggestions[`size${num}`].map((size, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
                                                onClick={() => handleSizeSelect(`size${num}`, size)}
                                            >
                                                {size}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full md:w-1/4 mb-4 md:px-1">
                        <b className="text-white block mb-2">Price{num + 1}:</b>
                        <div className="group relative">
                            <input
                                ref={priceInputRefs[`price${num + 1}`]}
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                name={`price${num + 1}`}
                                value={formData[`price${num + 1}`]}
                                onChange={handleChange}
                                onFocus={() => {
                                    const fieldName = `price${num + 1}`;
                                    if (formData[fieldName] && formData[fieldName].length > 0) {
                                        fetchPriceSuggestions(fieldName, formData[fieldName]);
                                        setShowPriceSuggestions(prev => ({ ...prev, [fieldName]: true }));
                                    }
                                }}
                                autoComplete="off"
                            />
                            {getTooltip(`price${num + 1}`) && (
                                <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                    {getTooltip(`price${num + 1}`)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                            {showPriceSuggestions[`price${num + 1}`] && priceSuggestions[`price${num + 1}`].length > 0 && (
                                <div
                                    ref={priceSuggestionsRefs[`price${num + 1}`]}
                                    className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                >
                                    {loadingPriceSuggestions[`price${num + 1}`] ? (
                                        <div className="px-4 py-2 text-white text-sm">Loading...</div>
                                    ) : (
                                        priceSuggestions[`price${num + 1}`].map((price, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
                                                onClick={() => handlePriceSelect(`price${num + 1}`, price)}
                                            >
                                                {price}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </React.Fragment>
            ))}
            <div className="w-full md:w-1/4 mb-4 md:pr-2">
                <b className="text-white block mb-2">Size4:</b>
                <div className="group relative">
                    <input
                        ref={sizeInputRefs.size4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name={`size4`}
                        value={formData[`size4`]}
                        onChange={handleChange}
                        onFocus={() => {
                            if (formData.size4 && formData.size4.length > 0) {
                                fetchSizeSuggestions('size4', formData.size4);
                                setShowSizeSuggestions(prev => ({ ...prev, size4: true }));
                            }
                        }}
                        autoComplete="off"
                    />
                    {getTooltip(`size4`) && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip(`size4`)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                    {showSizeSuggestions.size4 && sizeSuggestions.size4.length > 0 && (
                        <div
                            ref={sizeSuggestionsRefs.size4}
                            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {loadingSizeSuggestions.size4 ? (
                                <div className="px-4 py-2 text-white text-sm">Loading...</div>
                            ) : (
                                sizeSuggestions.size4.map((size, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors"
                                        onClick={() => handleSizeSelect('size4', size)}
                                    >
                                        {size}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4 mb-4 md:pl-2">
                <b className="text-white block mb-2 invisible">Placeholder</b>
                <Button type="submit" fullWidth loading={loading}>
                    <i className="bi bi-plus-lg"> </i>
                    Add Menu Item
                </Button>
            </div>
            <div className="w-full mt-2">
                {loading ? <Spinner /> : ""}
                {success && (
                    <p className="text-green-600 mt-2">
                        <i className="bi bi-check-circle-fill"> </i>
                        Menu item added successfully!
                    </p>
                )}
                {error && (
                    <p className="text-red-600 mt-2">
                        <i class="bi bi-exclamation-triangle"> </i>
                        {error.length > 0 ? error : ""}
                    </p>
                )}
            </div>
        </form>
    );
}
export default NewMenuItem;