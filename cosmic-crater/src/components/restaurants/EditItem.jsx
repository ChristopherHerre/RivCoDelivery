import React, { useEffect, useState, useCallback } from 'react';
import Spinner from '../users/Spinner';

function EditItem(props) {
    const item = props.item;
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const [success2, setSuccess2] = useState(false);
    const [loadingMenu, setLoadingMenu] = useState(false);
    const handleSave = (id) => {
        console.log("saving menu item");
        setSuccess2(false);
        setLoadingMenu(true);
        const updatedItem = menuItems.find(item => item.id === id);
        fetch(`/api/update-menu-item/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedItem),
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        })
        .then(() => {
            setSuccess2(true);
        })
        //.catch(() => setError("Failed to save changes"))
        .finally(() => setLoadingMenu(false));
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
    return (loadingMenu ? <Spinner /> :
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
                onClick={() => handleSave(item.id)} 
                className="btn btn-primary form-control mt-3 mb-3"
            >
                <i className="bi bi-pencil-square"></i> Save
            </button>
            {success2 && (
                <p className="text-success">
                    <i className="bi bi-check-circle-fill"> </i>
                    Item updated successfully.
                </p>
            )}

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