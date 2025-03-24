import React, { useEffect, useState } from 'react';
import axios from 'axios';
import qs from 'qs';
import { API_URL } from '../App';
import Spinner from '../users/Spinner';
import { set } from 'astro:schema';

export default function Admin(props) {
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [hasRestaurant, setHasRestaurant] = useState(false);
    const [restaurantData, setRestaurantData] = useState(null);
    useEffect(() => {
        async function fetchRestaurantStatus() {
            try {
                const response = await fetch('/api/getUserRestaurant');
                const data = await response.json();
                if (data.restaurant) {
                    setHasRestaurant(true);
                    setRestaurantData(data.restaurant);
                }
            } catch (error) {
                console.error("Error fetching restaurant data:", error);
            } finally {
                //setLoading(false);
                setLoading(true);
            }
        }
        fetchRestaurantStatus();
    }, []);

    function EditIngredients(props) {
        const [ingredients, setIngredients] = useState([]);
        const menuItem = props.menuItem;
        useEffect(() => {
            axios.get(`${API_URL}/api/menu/item/ingredients?menuItem=${menuItem}`)
                .then(response => setIngredients(response.data))
                .catch(error => console.error('Error fetching ingredients:', error));
        }, []);
        const handleChange = (id, key, value) => {
            setIngredients(prevItems =>
                prevItems.map(item =>
                    item.id === id ? { ...item, [key]: value } : item
                )
            );
        };
        const handleSave = (id) => {
            const updatedIngredient = ingredients.find(ing => ing.id === id);
            axios.put(`/api/menu-ingredients/${id}`, updatedIngredient)
                .then(() => alert('Updated successfully'))
                .catch(error => console.error('Error updating ingredient:', error));
        };
        return (
            <>
                {ingredients.length <= 0 && 
                    (<p>No ingredients found.</p>)
                } 
                {ingredients.length > 0 && (
                    <div className="row fw-bold border-bottom pb-2">
                        <h3 className="text-xl font-bold mb-4">
                            Edit Ingredients
                        </h3>
                    </div>
                )}
                {ingredients.map((ingredient, index) => {
                    const sortedFields = Object.keys(ingredient)
                        .filter((field) => field !== "ingredient_id" && field !== "menu_item_id")
                        .sort((a, b) => {
                            const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order",];
                            const indexA = order.indexOf(a);
                            const indexB = order.indexOf(b);
                            if (indexA === -1 && indexB === -1)
                                return a > b ? 1 : -1;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                        });
                        return (
                            <div 
                                key={ingredient.id} 
                                className={`row pb-4 ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-subtle'}`}>
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
                                <div className="col p-2">
                                    <button
                                        onClick={() => handleSave(ingredient.id)}
                                        className="btn btn-primary form-control">
                                        <i className="bi bi-pencil-square"> </i>
                                        Save
                                    </button>
                                </div>
                            </div>
                        );
                    })
                }
            </>
        );
    }
    
    const Menu = () => {
        const [menuItems, setMenuItems] = useState([]);
        const [error, setError] = useState(null);
        const [success2, setSuccess2] = useState(false);
        useEffect(() => {
            fetch(`/api/menu-items-list`)
                .then(res => res.json())
                .then(data => setMenuItems(data))
                .catch(() => setError('Failed to fetch menu items'));
        }, []);
        const handleChange = (id, key, value) => {
            setMenuItems(prevItems =>
                prevItems.map(item =>
                    item.id === id ? { ...item, [key]: value } : item
                )
            );
        };
        function ManageMenuItem(props) {
            const item = props.item;
            const [loadingMenu, setLoadingMenu] = useState(false);
            const handleSave = (id) => {
                console.log("saving menu item");
                setSuccess2(false);
                setLoadingMenu(true);
                setError(null);
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
                    setSuccess2(true);  // Show success message
                })
                .catch(() => setError("Failed to save changes"))
                .finally(() => setLoadingMenu(false));
            };
            function ShowEditItem(props) {
                return (
                    <>
                        <h3>Edit Item</h3>
                        {Object.keys(item).filter((key) => key !== "id" && key !== "restaurant_id").sort().map((key) => (
                            <div key={key}>
                                <b>{key}:</b>
                                <br />
                                <input
                                    type="text"
                                    value={item[key]}
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
                    </>
                );
            }
            return (
                <div key={item.id} className="col-12 mt-3 shadow-lg rounded-2">
                    <div className="row p-2">
                        <div className='col-12 col-xl-3 bg-primary-subtle rounded-1'>
                            <ShowEditItem key={item.id} /> 
                        </div>
                        <div className='col-12 col-xl-9'>
                            <EditIngredients menuItem={item.id} />
                        </div>
                    </div>
                </div>)
        }
        return (
            <div className="row">
                {error && <p className="text-red-500">{error}</p>}
                {menuItems.map(item => (
                    <ManageMenuItem key={item.id} item={item} />
                ))}
            </div>
        );
    };
    
    function submitRestaurant(e) {
        e.preventDefault();
        setLoading2(true);
        const form = e.target;
        const inputs = {
            name: form.elements['name'].value,
            category: form.elements['category'].value,
            address: form.elements['address'].value,
            latitude: form.elements['latitude'].value,
            longitude: form.elements['longitude'].value,
        };
        try {
            dbPost(e, form, inputs, "manageRestaurant");
            setTimeout(() => {
                setLoading2(false);
                setSuccess(true);
            }, 1000);
        } catch (err) {
            console.error("Error submitting restaurant:", err);
            setSuccess(false);
        }
    }
    return (
        <div>
            <h2>Admin Panel</h2>
            <form onSubmit={(e) => submitRestaurant(e)}>
                <div className="row p-2 shadow-lg rounded-2xl">
                    <h3>{hasRestaurant ? "Edit Restaurant" : "Add Restaurant"}</h3>
                    <div className="col-sm-4">
                        <b>Name: </b>
                        <input
                            className="bg-dark text-white form-control"
                            name="name"
                            type="text"
                            defaultValue={restaurantData?.name || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <b>Address: </b>
                        <input
                            className="bg-dark text-white form-control"
                            name="address"
                            type="text"
                            defaultValue={restaurantData?.address || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <b>Category: </b>
                        <input
                            className="bg-dark text-white form-control"
                            name="category"
                            type="text"
                            defaultValue={restaurantData?.category || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <b>Latitude: </b>
                        <input
                            className="bg-dark text-white form-control"
                            name="latitude"
                            type="text"
                            defaultValue={restaurantData?.latitude || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <b>Longitude: </b>
                        <input
                            className="bg-dark text-white form-control"
                            name="longitude"
                            type="text"
                            defaultValue={restaurantData?.longitude || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <br />
                        <input
                            className="form-control btn btn-primary"
                            type="submit"
                            value={hasRestaurant ? "Update" : "Add"}
                        />
                        {loading2 ? <Spinner /> : ""}
                    </div>
                    {success ? (
                        <p className="text-success">
                            <i className="bi bi-check-circle-fill"> </i>
                            {hasRestaurant ? "Restaurant updated successfully." : "Restaurant added successfully."}
                        </p>
                    ) : ""}
                </div>
            </form>
            <Menu />
        </div>
    );
}

export function dbPost(e, form, inputs, route) {
    e.preventDefault();
    const url = API_URL + "/api/" + route;
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(inputs),
        url,
    };
    axios(options);
}

export function dbPost2(e, inputs, route) {
    e.preventDefault();
    const url = API_URL + "/api/" + route;
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(inputs),
        url,
    };
    axios(options);
}
