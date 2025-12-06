import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import qs from 'qs';
import Spinner from '../../../../users/Spinner';

export function getTooltip(key) {
    if (key === "type") return "The category label for this ingredient";
    if (key === "ingredients_name") return "The name of this ingredient";
    if (key === "price") return "The default price";
    if (key === "easy_price") return "The easy option price";
    if (key === "extra_price") return "The extra option price";
    if (key === "inputType") return "Radio button = 0 or checkbox = 1";
    if (key === "customize") return "Enable customization options";
    if (key === "halfable") return "Can be applied to half an item";
    if (key === "sort_order") return "Order of display";
    if (key === "selected") return "Default selection state";
    // Add other fields as needed
    // Added tooltips for pizza menu columns
    if (key === "category") return "The menu category, e.g., Pizzas";
    if (key === "name") return "The name of the menu item, e.g., Build Your Own Pizza";
    if (key === "price2") return "Price for the second size (e.g., Medium)";
    if (key === "price3") return "Price for the third size (e.g., Large)";
    if (key === "price4") return "Price for the fourth size (if applicable)";
    if (key === "size1") return "Label for the first size option (e.g., Small)";
    if (key === "size2") return "Label for the second size option (e.g., Medium)";
    if (key === "size3") return "Label for the third size option (e.g., Large)";
    if (key === "size4") return "Label for the fourth size option (if applicable)";
    if (key === "sort") return "Order in which this menu item appears in the list";
    return ""; // Return empty string for fields without tooltips
}
export function isNumericField(key) {
    return key.includes('price') || 
           ['sort_order', 'sort', 'inputType', 'halfable', 'customize', 'selected'].includes(key);
}
function NewIngredient(props) {
    const menu_item_id = props.menuItem;
    const setIngredients = props.setIngredients;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      easy_price: '',
      extra_price: '',
      inputType: '1',
      ingredients_name: '',
      customize: '0',
      type: '',
      price: '',
      sort_order: '2',
      selected: '',
      halfable: ''
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, [name]: value
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        const formDataWithMenuItem = {
            ...formData,
            menu_item_id: menu_item_id,
        };
        axios.post(`/api/menu-item-ingredients`, 
            qs.stringify(formDataWithMenuItem), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then(response => {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false)
            }, 2000)
            setError('');
            setFormData({
                easy_price: '',
                extra_price: '',
                inputType: '1',
                ingredients_name: '',
                customize: '0',
                type: '',
                price: '',
                sort_order: '2',
                selected: '',
                halfable: ''
            });
            setIngredients(prevIngredients => [...prevIngredients, response.data.ingredient]);
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setTimeout(() => {
                setError("");
            }, 2000)
            setSuccess(false);
            console.error(err);
        });
    };
    return (
        <div className="p-2">
            <h3 className="text-white">
                Add New Ingredient
            </h3>
            {loading ? <Spinner /> :
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-wrap">
                        {Object.keys(formData).sort((a, b) => {
                            const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order"];
                            const indexA = order.indexOf(a);
                            const indexB = order.indexOf(b);
                            if (indexA === -1 && indexB === -1) return a > b ? 1 : -1;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                        }).map((key) => {
                            const tooltipText = getTooltip(key);
                            return (
                                <div className="w-full md:w-1/4" key={key}>
                                    <strong>{key}:</strong>
                                    <div className="group relative">
                                        <input
                                            {...(isNumericField(key) && ['inputType', 'halfable', 'customize', 'selected'].includes(key) ? {min: "0", max: "1"} : {})}
                                            {...(isNumericField(key) && key === 'sort_order' ? {min: "0"} : {})}
                                            {...(isNumericField(key) && key.includes('price') ? {min: "0", step: "0.01"} : {})}
                                            type={isNumericField(key) ? 'number' : 'text'}
                                            name={key} 
                                            value={formData[key]} 
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                        />
                                        {tooltipText && (
                                            <div className="absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                                                {tooltipText}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className='w-full md:w-1/4'>
                            <br />
                            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                <i class="bi bi-plus-lg"> </i>
                                Add Ingredient
                            </button>
                        </div>
                        <br />
                    </div>
                </form>
            }
            {success &&
                <p className="text-green-600">
                    <i className="bi bi-check-circle-fill"> </i>
                    Ingredient added successfully!
                </p>
            }
            {error && (
                <p className="text-red-600 mt-2">
                    <i class="bi bi-exclamation-triangle"> </i>
                    {error.length > 0 ? error : ""}
                </p>
            )}
        </div>
    );
}
export default NewIngredient;