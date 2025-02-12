import React, { useEffect, useState } from 'react';
import axios from 'axios';
import qs from 'qs';
import { API_URL } from '../App';

export default function Admin(props) {
    const [arr, setArr] = useState([]);
    const [arr2, setArr2] = useState([]);
    const [restaurant, setRestaurant] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

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
        const form = e.target;
        const inputs = {
            name: form.elements['name'].value,
            address: form.elements['address'].value,
            latitude: form.elements['latitude'].value,
            longitude: form.elements['longitude'].value,
        };
        dbPost(e, form, inputs, "addRestaurant");
    }

    return (
        <div>
            <h2>Admin Panel</h2>
            <form onSubmit={(e) => submitAddRestaurant(e)}>
                <div className="row m-3">
                    <h2>Add Restaurant</h2>
                    <div className="col-sm-6">
                        <label>Latitude: </label>
                        <br />
                        <input className="bg-dark text-white form-control" name="latitude" type="text" />
                    </div>
                    <div className="col-sm-6">
                        <label>Longitude: </label>
                        <br />
                        <input className="bg-dark text-white form-control" name="longitude" type="text" />
                    </div>
                    <div className="col-sm-4">
                        <label>Name: </label>
                        <br />
                        <input className="bg-dark text-white form-control" name="name" type="text" />
                    </div>
                    <div className="col-sm-4">
                        <label>Address: </label>
                        <br />
                        <input className="bg-dark text-white form-control" name="address" type="text" />
                    </div>
                    <div className="col-sm-4">
                        <br />
                        <input className="form-control btn btn-primary" type="submit" />
                    </div>
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
