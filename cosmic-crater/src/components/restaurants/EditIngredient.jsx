import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import Spinner from '../users/Spinner';
import AddIngredient from './AddIngredient';

const EditIngredients = React.memo(function EditIngredients(props) {
    const [ingredients, setIngredients] = useState([]);
    const menuItem = props.menuItem;
    useEffect(() => {
        axios.get(`${API_URL}/api/menu/item/ingredients?menuItem=${menuItem}`)
            .then(response => setIngredients(response.data))
            .catch(error => console.error('Error fetching ingredients:', error));
    }, []);
    const handleChange = useCallback((id, key, value) => {
        setIngredients(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    });
    const handleSave = (id) => {
        const updatedIngredient = ingredients.find(ing => ing.id === id);
        axios.put(`/api/menu-ingredients/${id}`, updatedIngredient)
            .then(() => alert('Updated successfully'))
            .catch(error => console.error('Error updating ingredient:', error));
    };
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this ingredient?")) {
            axios.delete(`/api/menu-item-ingredients/${id}`)
                .then(() => {
                    setIngredients(prevItems => prevItems.filter(item => item.id !== id));
                    alert("Ingredient deleted successfully");
                })
                .catch(error => console.error("Error deleting ingredient:", error));
        }
    };
    return (
        <>
            {ingredients.length <= 0 && (<p>No ingredients found.</p>)}
            {ingredients.length > 0 && (
                <div className="row fw-bold">
                    <h3 className="text-xl font-bold">Edit Ingredients</h3>
                </div>
            )}
            {ingredients.map((ingredient, index) => {
                const sortedFields = Object.keys(ingredient)
                    .filter((field) => field !== "ingredient_id" && field !== "menu_item_id" && field !== "id")
                    .sort((a, b) => {
                        const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order"];
                        const indexA = order.indexOf(a);
                        const indexB = order.indexOf(b);
                        if (indexA === -1 && indexB === -1) return a > b ? 1 : -1;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                return (
                    <div key={ingredient.id} className={`row pb-4 ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-subtle'}`}>
                        {sortedFields.map((field) => (
                            <div key={field} className="col-12 col-md-3">
                                <b>{field}:</b>
                                <input
                                    type={typeof ingredient[field] === "number" ? "number" : "text"}
                                    defaultValue={ingredient[field] ?? ""}
                                    onChange={(e) => handleChange(ingredient.id, field, e.target.value)}
                                    className="form-control bg-dark text-white"
                                />
                            </div>
                        ))}
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
                    </div>
                );
            })}
            <div className="row bg-dark text-white">
                <div className="col-12">
                    <AddIngredient
                        menuItem={menuItem}
                        setIngredients={setIngredients}
                    />
                </div>
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    return prevProps.menuItem === nextProps.menuItem;
});

export default EditIngredients;