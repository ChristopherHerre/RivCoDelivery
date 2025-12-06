import React, { useEffect, useState } from 'react';
import Spinner from '../users/Spinner';
import { dbPost } from './Admin';
import PlaceAutocomplete from '../users/address/PlaceAutocomplete';

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
            <div className="flex flex-wrap p-2 shadow-lg">
                <div className="w-full">
                    <h3>
                        {hasRestaurant ? "Edit Restaurant" : "Add Restaurant"}
                    </h3>
                </div>
                <div className="w-full md:w-1/3">
                    <b>Name: </b>
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="name"
                        type="text"
                        defaultValue={restaurantData?.name || ""}
                        required
                    />
                </div>
                <div className="w-full md:w-1/3">
                    <b>Category: </b>
                    <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        name="category"
                        type="text"
                        defaultValue={restaurantData?.category || ""}
                        required
                    />
                </div>
                <div className="w-full md:w-2/3">
                    <b>Address: </b>
                    <PlaceAutocomplete
                        className="bg-gray-900 text-white"
                        defaultValue={restaurantData?.address}
                        onPlaceSelected={({ address, latitude, longitude }) => {
                            document.querySelector('[name="address"]').value = `${address.streetNumber} ${address.street}, ${address.city}, ${address.state} ${address.zip}`;
                            document.querySelector('[name="latitude"]').value = latitude;
                            document.querySelector('[name="longitude"]').value = longitude;
                        }}
                    />
                </div>
                <input type="hidden" value={restaurantData.address} name="address" />
                <input type="hidden" value={restaurantData.latitude} name="latitude" />
                <input type="hidden" value={restaurantData.longitude}name="longitude" />
                <div className="w-full md:w-1/3">
                    <br />
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        {hasRestaurant ? (
                            <>
                                <i className="bi bi-pencil-square me-2"> </i>
                                Save
                            </>
                        ) : (
                            <>
                                <i className="bi bi-plus me-2"> </i>
                                Add Restaurants
                            </>
                        )}
                    </button>
                </div>
                {loading2 ? <Spinner /> : ""}
                {success ? (
                    <p className="text-green-600">
                        <i className="bi bi-check-circle-fill"> </i>
                        {hasRestaurant ? "Restaurant updated successfully." : "Restaurant added successfully."}
                    </p>
                ) : ""}
                {error && (
                    <p className="text-red-600 mt-2">
                        <i className="bi bi-exclamation-triangle"> </i>
                        {error.length > 0 ? error : ""}
                    </p>
                )}
            </div>
        </form>);
}
export default ManageRestaurant;