import React, { useState, useCallback } from 'react';
import Spinner from '../../../users/Spinner';
import axios from 'axios';
import { isNumericField, getTooltip } from './ingredients/NewIngredient';
function EditItem(props) {
    const item = props.item;
    const [success2, setSuccess2] = useState(false);
    const [error, setError] = useState("");
    const [error2, setError2] = useState("");
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const loading3 = props.loading3;
    const setLoading3 = props.setLoading3;
    const handleSave = async (e, id) => {
        e.preventDefault();
        setLoading3(true);
        console.log("saving menu item");
        const updatedItem = menuItems.find(item => item.id === id);
        try {
            const response = await axios.post(`/api/update-menu-item/${id}`, updatedItem, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("response.status: " + response.status);
            if (response.status >= 200 && response.status < 300) {
                setSuccess2(true);
                setTimeout(() => {
                    setSuccess2(false);
                }, 2000);
                console.log("Menu item updated successfully:", response.data);
            } else {
                console.error("Server returned an error:", response.statusText);
                setSuccess2(false);
            }
        } catch (err) {
            console.error("Error updating menu item:", err);
            setSuccess2(false);
            setError(err.message);
            setTimeout(() => {
                setError("");
            }, 2000);
        } finally {
            setLoading3(false);
        }
    };
    const handleDeleteMenuItem = (id) => {
        if (window.confirm("Are you sure you want to delete this menu item?")) {
            fetch(`/api/menu-items/${id}`, {
                method: "DELETE",
            })
            .then(res => {
                if (!res.ok) throw new Error("Failed to delete menu item");
                return res.json();
            })
            .then(() => {
                setMenuItems(prevItems => prevItems.filter(item => item.id !== id));
                alert("Menu item deleted successfully");
            })
            .catch(err => {
                console.error("Error deleting menu item:", err);
                setError2(err.message);
                setTimeout(() => {
                    setError2("");
                }, 2000);
            });
        }
    };
    const handleChange = useCallback((id, key, value) => {
        setMenuItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    }, []);
    return (loading3 ? <Spinner /> :
        <>
            <h3>Edit Item</h3>
            {Object.keys(item).filter((key) => key !== "id" && key !== "restaurant_id").sort().map((key) => {
                const tooltipText = getTooltip(key);
                return (
                    <div key={key}>
                        <b>{key}:</b>
                        <br />
                        <div className="group relative">
                            <input
                                {...(isNumericField(key) && key.includes('price') ? {min: "0", step: "0.01"} : {})}
                                type={isNumericField(key) ? "number" : "text"}
                                defaultValue={item[key] ?? ""}
                                onChange={(e) => handleChange(item.id, key, e.target.value)}
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
            <button 
                onClick={(e) => handleSave(e, item.id)} 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mt-3 mb-3"
            >
                <i className="bi bi-pencil-square"></i> Save
            </button>
            {success2 ? (
                <p className="text-green-600">
                    <i className="bi bi-check-circle-fill"> </i>
                    Item updated successfully.
                </p>) : ""
            }
            {error && (
                <p className="text-red-600 mt-2">
                    <i class="bi bi-exclamation-triangle"> </i>
                    {error.length > 0 ? error : ""}
                </p>
            )}
            <button 
                onClick={() => handleDeleteMenuItem(item.id)} 
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors mt-3 mb-3"
            >
                <i className="bi bi-trash"> </i>
                Delete
            </button>
            {error2 && (
                <p className="text-red-600 mt-2">
                    <i class="bi bi-exclamation-triangle"> </i>
                    {error2.length > 0 ? error2 : ""}
                </p>
            )}
        </>
    );
}
export default EditItem;