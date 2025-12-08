import React, { useState } from 'react';
import Spinner from '../../../users/Spinner';
import { dbPost } from '../../Admin';
import { getTooltip } from './ingredients/NewIngredient';
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
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
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
        <form onSubmit={submitMenuItem} className="flex flex-wrap shadow-lg rounded-2xl bg-gray-900 text-white mt-3 p-2">
            <h3 className="text-white w-full mb-4">Add New Menu Item</h3>
            <div className="w-full md:w-1/4">
                <b>Name:</b>
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
            <div className="w-full md:w-1/4">
                <b>Category:</b>
                <div className="group relative">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    />
                    {getTooltip("category") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("category")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4">
                <b>Sort:</b>
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
            <div className="w-full md:w-1/4">
                <b>Price:</b>
                <div className="group relative">
                    <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />
                    {getTooltip("price") && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip("price")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            {/* Size and Price Fields */}
            {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                    <div className="w-full md:w-1/4">
                        <b>Size{num}:</b>
                        <div className="group relative">
                            <input
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                name={`size${num}`}
                                value={formData[`size${num}`]}
                                onChange={handleChange}
                            />
                            {getTooltip(`size${num}`) && (
                                <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                    {getTooltip(`size${num}`)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full md:w-1/4">
                        <b>Price{num + 1}:</b>
                        <div className="group relative">
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                name={`price${num + 1}`}
                                value={formData[`price${num + 1}`]}
                                onChange={handleChange}
                            />
                            {getTooltip(`price${num + 1}`) && (
                                <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                    {getTooltip(`price${num + 1}`)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </React.Fragment>
            ))}
            <div className="w-full md:w-1/4">
                <b>Size4:</b>
                <div className="group relative">
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name={`size4`}
                        value={formData[`size4`]}
                        onChange={handleChange}
                    />
                    {getTooltip(`size4`) && (
                        <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {getTooltip(`size4`)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full md:w-1/4">
                <br />
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    <i class="bi bi-plus-lg"> </i>
                    Add Menu Item
                </button>
            </div>
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
        </form>
    );
}
export default NewMenuItem;