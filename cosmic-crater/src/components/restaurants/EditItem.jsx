import React, { useState, useCallback } from 'react';
import { dbPost } from './Admin';
import Spinner from '../users/Spinner';
import axios from 'axios';
import { API_URL } from '../App';

function EditItem(props) {
    const item = props.item;
    const [success2, setSuccess2] = useState(false);
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const handleSave = async (e, id) => {
        e.preventDefault();
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
            .catch(err => console.error("Error deleting menu item:", err));
        }
    };
    const handleChange = useCallback((id, key, value) => {
        setMenuItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [key]: value } : item
            )
        );
    }, []);
    return (
        <>
            <h3>Edit Item</h3>
            {Object.keys(item).filter((key) => key !== "id" && key !== "restaurant_id").sort().map((key) => (
                <div key={key}>
                    <b>{key}:</b>
                    <br />
                    <input
                        type="text"
                        defaultValue={item[key]}
                        onChange={(e) => handleChange(item.id, key, e.target.value)}
                        className="ml-2 p-1 border rounded form-control bg-dark text-white"
                    />
                </div>
            ))}
            <button 
                onClick={(e) => handleSave(e, item.id)} 
                className="btn btn-primary form-control mt-3 mb-3"
            >
                <i className="bi bi-pencil-square"></i> Save
            </button>
            {success2 ? (
                <p className="text-success">
                    <i className="bi bi-check-circle-fill"> </i>
                    Item updated successfully.
                </p>) : ""
            }

            <button 
                onClick={() => handleDeleteMenuItem(item.id)} 
                className="btn btn-danger form-control mt-3 mb-3"
            >
                <i className="bi bi-trash"> </i>
                Delete
            </button>
        </>
    );
}
export default EditItem;