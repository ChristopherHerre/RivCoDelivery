import React, { useEffect, useState } from 'react';
import Spinner from '../users/Spinner';
import { dbPost } from './Admin';

function ManageRestaurant(props) {
    const setSuccess = props.setSuccess;
    const setLoading2 = props.setLoading2;
    const loading2 = props.loading2;
    const setLoading = props.setLoading;
    const success = props.success;
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
                setLoading(true);
            }
        }
        fetchRestaurantStatus();
    }, []);
    async function submitRestaurant(e) {
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
            const response = await dbPost(e, form, inputs, "manageRestaurant");
            if (response.status >= 200 && response.status < 300) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                }, 2000);
            } else {
                console.error("Server returned an error:", response.statusText);
                setSuccess(false);
            }
        } catch (err) {
            console.error("Error submitting restaurant:", err);
            setSuccess(false);
        } finally {
            setLoading2(false);
        }
    }
    return (<form onSubmit={(e) => submitRestaurant(e)}>
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
                    value={hasRestaurant ? "Save" : "Add"}
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
    </form>);
}
export default ManageRestaurant;