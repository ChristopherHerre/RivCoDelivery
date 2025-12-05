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
    
    useEffect(() => {
        // Only import and use Bootstrap on the client side
        if (typeof window === 'undefined') return;
        
        let bootstrapModule = null;
        let tooltipInstances = [];
        
        const initTooltips = async () => {
            try {
                bootstrapModule = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
                const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
                tooltipTriggerList.forEach(el => {
                    const tooltip = new bootstrapModule.Tooltip(el);
                    tooltipInstances.push(tooltip);
                });
            } catch (error) {
                console.error('Error loading Bootstrap:', error);
            }
        };
        
        initTooltips();
        
        // Cleanup function
        return () => {
            if (typeof window !== 'undefined') {
                tooltipInstances.forEach(tooltip => {
                    if (tooltip) tooltip.dispose();
                });
                tooltipInstances = [];
            }
        };
    }, []);
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
                    <div className="row">
                        {Object.keys(formData).sort((a, b) => {
                            const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order"];
                            const indexA = order.indexOf(a);
                            const indexB = order.indexOf(b);
                            if (indexA === -1 && indexB === -1) return a > b ? 1 : -1;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                        }).map((key) => (
                            <div className="col-12 col-md-3" key={key}>
                                <strong>{key}:</strong>
                                <input
                                    {...(isNumericField(key) && ['inputType', 'halfable', 'customize', 'selected'].includes(key) ? {min: "0", max: "1"} : {})}
                                    {...(isNumericField(key) && key === 'sort_order' ? {min: "0"} : {})}
                                    {...(isNumericField(key) && key.includes('price') ? {min: "0", step: "0.01"} : {})}
                                    data-bs-toggle="tooltip"
                                    title={getTooltip(key)}
                                    type={isNumericField(key) ? 'number' : 'text'}
                                    name={key} 
                                    value={formData[key]} 
                                    onChange={handleChange}
                                    className="form-control bg-dark text-white" 
                                />
                            </div>
                        ))}
                        <div className='col-12 col-md-3'>
                            <br />
                            <button type="submit" className="btn btn-primary form-control">
                                <i class="bi bi-plus-lg"> </i>
                                Add Ingredient
                            </button>
                        </div>
                        <br />
                    </div>
                </form>
            }
            {success &&
                <p className="text-success">
                    <i className="bi bi-check-circle-fill"> </i>
                    Ingredient added successfully!
                </p>
            }
            {error && (
                <p className="text-danger mt-2">
                    <i class="bi bi-exclamation-triangle"> </i>
                    {error.length > 0 ? error : ""}
                </p>
            )}
        </div>
    );
}
export default NewIngredient;