import React, { useEffect, useState } from 'react';
import axios from 'axios';
import qs from 'qs';
import { API_URL } from '../App';
import Spinner from '../users/Spinner';

export default function Admin(props) {
    const [arr, setArr] = useState([]);
    const [arr2, setArr2] = useState([]);
    const [restaurant, setRestaurant] = useState(1);
    const [success, setSuccess] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    //const [loading, setLoading] = useState(true);
    const [hasRestaurant, setHasRestaurant] = useState(false);
    const [restaurantData, setRestaurantData] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/api/restaurants/${latitude}/${longitude}`)
            .then(res => {
                setArr2(res.data);
            });
        setLoading(true);
        axios.get(API_URL + '/api/menu', { params: { restaurant, page, limit: 1 } })
            .then(res => {
                setArr(res.data);
            })
            .catch(err => console.error("Error fetching menu items:", err))
            .finally(() => setLoading(false));
    }, [restaurant, page, latitude, longitude]);

    const handleNextPage = () => setPage(prevPage => prevPage + 1);
    const handlePreviousPage = () => setPage(prevPage => Math.max(prevPage - 1, 1));
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
                setLoading(false);
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
        const handleChange = (id, field, value) => {
            const parsedValue =
                field === 'id' || field === 'inputType' || field === 'halfable' || field === 'customize' || field === 'sort_order' || field === 'selected'
                    ? parseInt(value, 10) || 0
                    : field === 'easy_price' || field === 'extra_price' || field === 'price'
                    ? parseFloat(value) || 0.0
                    : value;
            setIngredients(prev => prev.map(ing => 
                ing.id === id ? { ...ing, [field]: parsedValue } : ing
            ));
        };
        const handleSave = (id) => {
            const updatedIngredient = ingredients.find(ing => ing.id === id);
            axios.put(API_URL + `/api/menu-ingredients/${id}`, updatedIngredient)
                .then(() => alert('Updated successfully'))
                .catch(error => console.error('Error updating ingredient:', error));
        };
        return (
            <div className="container">
                {ingredients.length > 0 && (
                    <div className="row fw-bold border-bottom pb-2">
                        <h3 className="text-xl font-bold mb-4">
                            Edit Ingredients
                        </h3>
                        {['ID', 'Easy Price', 'Extra Price', 'Input Type', 'Name', 'Customize', 'Type', 'Price', 'Sort Order', 'Selected', 'Halfable', 'Actions'].map(header => (
                            <div key={header} className="col-12 col-md-2 border p-2">
                                {header}
                            </div>
                        ))}
                    </div>
                )}
                {ingredients.map(ingredient => (
                    <div key={ingredient.id} className="row border-bottom py-2">
                        {Object.keys(ingredient).map(field => (
                            <div key={field} className="col-12 col-md-2 p-2">
                                <input 
                                    type={typeof ingredient[field] === 'number' ? 'number' : 'text'}
                                    value={ingredient[field] || ''} 
                                    onChange={(e) => handleChange(ingredient.id, field, e.target.value)}
                                    className="form-control bg-dark text-white"
                                />
                            </div>
                        ))}
                        <div className="col p-2">
                            <button onClick={() => handleSave(ingredient.id)} className="btn btn-primary">Save</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const Menu = () => {
        const [menuItems, setMenuItems] = useState([]);
        const [error, setError] = useState(null);

        useEffect(() => {
            fetch('/api/menu-items-list')
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

        const handleSave = (id) => {
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
                .catch(() => setError("Failed to save changes"));
        };

        return (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {error &&
                    <p className="text-red-500">
                        {error}
                    </p>
                }
                {menuItems.map(item => (
                    <div key={item.id} className="m-3 p-4 shadow-lg rounded-2xl">
                        <div className="row">
                            <div className='col-12 col-xl-3 text-center bg-secondary'>
                                <h3>Edit Item</h3>
                                {Object.keys(item)
                                    .sort()
                                    .map((key) => (
                                        <div key={key} className="mb-2">
                                            <label className="font-bold">{key}:</label>
                                            <br />
                                            <input
                                                type="text"
                                                value={item[key]}
                                                onChange={(e) => handleChange(item.id, key, e.target.value)}
                                                className="ml-2 p-1 border rounded w-full bg-dark text-white"
                                            />
                                        </div>
                                    ))
                                }
                                <button 
                                    onClick={() => handleSave(item.id)} 
                                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                            <div className='col-12 col-xl-9'>   
                                <EditIngredients menuItem={item.id} />
                            </div>
                        </div>
                    </div>
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
                <div className="row m-3">
                    <h3>{hasRestaurant ? "Update Restaurant" : "Add Restaurant"}</h3>
                    <div className="col-sm-4">
                        <label>Name: </label>
                        <input
                            className="bg-dark text-white form-control"
                            name="name"
                            type="text"
                            defaultValue={restaurantData?.name || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label>Address: </label>
                        <input
                            className="bg-dark text-white form-control"
                            name="address"
                            type="text"
                            defaultValue={restaurantData?.address || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label>Category: </label>
                        <input
                            className="bg-dark text-white form-control"
                            name="category"
                            type="text"
                            defaultValue={restaurantData?.category || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label>Latitude: </label>
                        <input
                            className="bg-dark text-white form-control"
                            name="latitude"
                            type="text"
                            defaultValue={restaurantData?.latitude || ""}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label>Longitude: </label>
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
            {loading ? (
                <p>Loading...</p>
            ) : (
                arr.length > 0 ? (
                    <div>
                        <h3>{arr[0].mi_name}</h3>
                        <p>Price: {arr[0].price}</p>
                        <button
                            className="btn btn-secondary" 
                            onClick={handlePreviousPage} 
                            disabled={page === 1}>
                                Previous
                        </button>
                        <b> Page {page} </b>
                        <button
                            className="btn btn-secondary"
                            onClick={handleNextPage}>
                                Next
                        </button>
                    </div>
                ) : (
                    <p>No menu items found.</p>
                )
            )}
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
