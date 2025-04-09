import React, { useEffect, useState } from 'react';
import Spinner from '../users/Spinner';
import { dbPost } from './Admin';

function ManageRestaurant(props) {
    const setSuccess = props.setSuccess;
    const setLoading2 = props.setLoading2;
    const loading2 = props.loading2;
    const success = props.success;
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
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
                setLoading(false);
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
                setHasRestaurant(true);
                setRestaurantData({
                  name: inputs.name,
                  address: inputs.address,
                  category: inputs.category,
                  latitude: inputs.latitude,
                  longitude: inputs.longitude,
                });
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
            setError(err.message);
            setTimeout(() => {
                setError("");
            }, 2000);
        } finally {
            setLoading2(false);
        }
    }
    return (loading ? <Spinner /> :
        <form onSubmit={(e) => submitRestaurant(e)}>
            <div className="row p-2 shadow-lg rounded-2xl">
                <div className="col-12">
                    <h3>
                        {hasRestaurant ? "Edit Restaurant" : "Add Restaurant"}
                    </h3>
                </div>
                <div className="col-12 col-md-4">
                    <b>Name: </b>
                    <input
                        className="bg-dark text-white form-control"
                        name="name"
                        type="text"
                        defaultValue={restaurantData?.name || ""}
                        required
                    />
                </div>
                <div className="col-12 col-md-4">
                    <b>Address: </b>
                    <input
                        className="bg-dark text-white form-control"
                        name="address"
                        type="text"
                        defaultValue={restaurantData?.address || ""}
                        required
                    />
                </div>
                <div className="col-12 col-md-4">
                    <b>Category: </b>
                    <input
                        className="bg-dark text-white form-control"
                        name="category"
                        type="text"
                        defaultValue={restaurantData?.category || ""}
                        required
                    />
                </div>
                <div className="col-12 col-md-4">
                    <b>Latitude: </b>
                    <input
                        className="bg-dark text-white form-control"
                        name="latitude"
                        type="text"
                        defaultValue={restaurantData?.latitude || ""}
                        required
                    />
                </div>
                <div className="col-12 col-md-4">
                    <b>Longitude: </b>
                    <input
                        className="bg-dark text-white form-control"
                        name="longitude"
                        type="text"
                        defaultValue={restaurantData?.longitude || ""}
                        required
                    />
                </div>
                <div className="col-12 col-md-4">
                    <br />
                    <button type="submit" className="form-control btn btn-primary">
                        {hasRestaurant ? (
                            <>
                                <i className="bi bi-pencil-square me-2"></i> Save
                            </>
                        ) : (
                            <>
                                <i className="bi bi-plus me-2"></i> Add
                            </>
                        )}
                    </button>
                </div>
                {loading2 ? <Spinner /> : ""}
                {success ? (
                    <p className="text-success">
                        <i className="bi bi-check-circle-fill"> </i>
                        {hasRestaurant ? "Restaurant updated successfully." : "Restaurant added successfully."}
                    </p>
                ) : ""}
                {error && (
                    <p className="text-danger mt-2">
                        <i class="bi bi-exclamation-triangle"> </i>
                        {error.length > 0 ? error : ""}
                    </p>
                )}
            </div>
        </form>);
}
export default ManageRestaurant;