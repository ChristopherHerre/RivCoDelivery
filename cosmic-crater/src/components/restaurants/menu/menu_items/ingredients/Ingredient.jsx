import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Spinner from '../../../../users/Spinner';
import { isNumericField, getTooltip } from './NewIngredient';
function Ingredient(props) {
    const index = props.index;
    const sortedFields = props.sortedFields;
    const ingredient = props.ingredient;
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [error2, setError2] = useState("");
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
    return (
        <div key={ingredient.id} className={`flex flex-wrap pb-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
            {
                sortedFields.map((field) => {
                    const tooltipText = getTooltip(field);
                    return (
                        <div key={field} className="w-full md:w-1/4">
                            <b>{field}:</b>
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
                    )
                })
            }
            <div className="w-full md:w-1/4">
                <br />
                <button onClick={() => handleSave(ingredient.id)} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    <i className="bi bi-pencil-square"> </i>Save
                </button>
                
            </div>
            <div className="w-full md:w-1/4">
                <br />
                <button onClick={() => handleDelete(ingredient.id)} className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                    <i className="bi bi-trash"> </i>Delete
                </button>
            </div>
            <div className="w-full">
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
                )
            }
            </div>
            <div className="w-full">
                {error2 && (
                    <p className="text-red-600 mt-2">
                        <i class="bi bi-exclamation-triangle"> </i>
                        {error2.length > 0 ? error2 : ""}
                    </p>
                )}
            </div>
        </div>
    )
}
export default Ingredient;