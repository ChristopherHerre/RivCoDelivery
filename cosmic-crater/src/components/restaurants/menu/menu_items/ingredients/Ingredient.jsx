import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Spinner from '../../../../users/Spinner';
import { isNumericField, getTooltip } from './NewIngredient';
import Button from '../../../../common/Button';
function Ingredient(props) {
    const index = props.index;
    const sortedFields = props.sortedFields;
    const ingredient = props.ingredient;
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [error2, setError2] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const handleChange = useCallback((id, key, value) => {
        setIngredients(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    });
    const handleSave = async (id) => {
        const updatedIngredient = ingredients.find(ing => ing.id === id);
        try {
            const response = await axios.put(`/api/menu-ingredients/${id}`, updatedIngredient);
            if (response.status >= 200 && response.status < 300) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                }, 2000);
            } else {
                console.error("Server returned an error:", response.statusText);
                setSuccess(false);
            }
        } catch (error) {
            console.error('Error updating ingredient:', error);
            setSuccess(false);
            setError(error.message);
            setTimeout(() => {
                setError("");
            }, 2000);
        }
    };
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this ingredient?")) {
            axios.delete(`/api/menu-item-ingredients/${id}`)
                .then(() => {
                    setIngredients(prevItems => prevItems.filter(item => item.id !== id));
                    alert("Ingredient deleted successfully");
                })
                .catch(error => {
                    console.error("Error deleting ingredient:", error);
                    setError2(error.message);
                    setTimeout(() => {
                        setError2("");
                    }, 2000);
                });
        }
    };
    console.log("sortedFields2: " + sortedFields);
    const ingredientsName = ingredient.ingredients_name || 'Unnamed Ingredient';
    
    return (
        <div key={ingredient.id} className={`mb-4 rounded-lg ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
            {/* Collapsible Header */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h4 className="font-semibold text-lg">{ingredientsName}</h4>
                <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-xl`}></i>
            </div>
            
            {/* Collapsible Content */}
            {isExpanded && (
                <div className="flex flex-wrap pb-4 px-4">
                    {
                        sortedFields.map((field) => {
                            const tooltipText = getTooltip(field);
                            return (
                                <div key={field} className="w-full md:w-1/4 mb-4 md:pr-2">
                                    <b className="block mb-2">{field}:</b>
                                    <div className="group relative">
                                        <input
                                            {...(isNumericField(field) && ['inputType', 'halfable', 'customize', 'selected'].includes(field) ? {min: "0", max: "1"} : {})}
                                            {...(isNumericField(field) && field === 'sort_order' ? {min: "0"} : {})}
                                            {...(isNumericField(field) && field.includes('price') ? {min: "0", step: "0.01"} : {})}
                                            type={isNumericField(field) ? "number" : "text"}
                                            defaultValue={ingredient[field] ?? ""}
                                            onChange={(e) => handleChange(ingredient.id, field, e.target.value)}
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
                        })
                    }
                <div className="w-full md:w-1/4 mb-4 md:pr-2">
                    <b className="block mb-2">&nbsp;</b>
                    <Button onClick={() => handleSave(ingredient.id)} fullWidth>
                        <i className="bi bi-pencil-square"> </i>Save
                    </Button>
                </div>
                <div className="w-full md:w-1/4 mb-4 md:pr-2">
                    <b className="block mb-2">&nbsp;</b>
                    <Button onClick={() => handleDelete(ingredient.id)} variant="danger" fullWidth>
                        <i className="bi bi-trash"> </i>Delete
                    </Button>
                </div>
                <div className="w-full mt-2">
                    {success ? (
                        <p className="text-green-600">
                            <i className="bi bi-check-circle-fill"> </i>
                            Ingredient updated successfully.
                        </p>) : ""
                    }
                    {error && (
                        <p className="text-red-600 mt-2">
                            <i class="bi bi-exclamation-triangle"> </i>
                            {error.length > 0 ? error : ""}
                        </p>
                    )}
                    {error2 && (
                        <p className="text-red-600 mt-2">
                            <i class="bi bi-exclamation-triangle"> </i>
                            {error2.length > 0 ? error2 : ""}
                        </p>
                    )}
                </div>
            </div>
        )}
        </div>
    )
}
export default Ingredient;