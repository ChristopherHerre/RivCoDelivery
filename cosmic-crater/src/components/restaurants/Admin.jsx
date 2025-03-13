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

    function submitAddRestaurant(e) {
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
            console.error("Error adding restaurant:", err);
            setSuccess(false);
        }
    }
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
            {loading ? (
                <p>Loading...</p>
            ) : (
                arr.length > 0 ? (
                    <div>
                        <h3>{arr[0].mi_name}</h3>
                        <p>Price: {arr[0].price}</p>
                        <button className="btn btn-secondary" onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
                        <b> Page {page} </b>
                        <button className="btn btn-secondary" onClick={handleNextPage}>Next</button>
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
