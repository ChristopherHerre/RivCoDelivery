import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Spinner from '../../../../users/Spinner';
import { isNumericField, getTooltip } from './NewIngredient';
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
function Ingredient(props) {
    const index = props.index;
    const sortedFields = props.sortedFields;
    const ingredient = props.ingredient;
    const ingredients = props.ingredients;
    const setIngredients = props.setIngredients;
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [error2, setError2] = useState("");
    useEffect(() => {
        // Initialize tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
        
        // Cleanup function
        return () => {
            tooltipTriggerList.forEach(el => {
                const tooltip = bootstrap.Tooltip.getInstance(el);
                if (tooltip) tooltip.dispose();
            });
        };
    }, []);
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
        <div key={ingredient.id} className={`row pb-4 ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-subtle'}`}>
            {
                sortedFields.map((field) => {
                    return (
                        <div key={field} className="col-12 col-md-3">
                            <b>{field}:</b>
                            <input
                                {...(isNumericField(field) && ['inputType', 'halfable', 'customize', 'selected'].includes(field) ? {min: "0", max: "1"} : {})}
                                {...(isNumericField(field) && field === 'sort_order' ? {min: "0"} : {})}
                                {...(isNumericField(field) && field.includes('price') ? {min: "0", step: "0.01"} : {})}
                                data-bs-toggle="tooltip"
                                title={getTooltip(field)}
                                type={isNumericField(field) ? "number" : "text"}
                                defaultValue={ingredient[field] ?? ""}
                                onChange={(e) => handleChange(ingredient.id, field, e.target.value)}
                                className="form-control bg-dark text-white"
                            />
                        </div>
                    )
                })
            }
            <div className="col-12 col-md-3">
                <br />
                <button onClick={() => handleSave(ingredient.id)} className="btn btn-primary form-control">
                    <i className="bi bi-pencil-square"> </i>Save
                </button>
                
            </div>
            <div className="col-12 col-md-3">
                <br />
                <button onClick={() => handleDelete(ingredient.id)} className="btn btn-danger form-control">
                    <i className="bi bi-trash"> </i>Delete
                </button>
            </div>
            <div className="col-12">
            {success ? (
                    <p className="text-success">
                        <i className="bi bi-check-circle-fill"> </i>
                        Ingredient updated successfully.
                    </p>) : ""
                }
                {error && (
                    <p className="text-danger mt-2">
                        <i class="bi bi-exclamation-triangle"> </i>
                        {error.length > 0 ? error : ""}
                    </p>
                )
            }
            </div>
            <div className="col-12">
                {error2 && (
                    <p className="text-danger mt-2">
                        <i class="bi bi-exclamation-triangle"> </i>
                        {error2.length > 0 ? error2 : ""}
                    </p>
                )}
            </div>
        </div>
    )
}
export default Ingredient;