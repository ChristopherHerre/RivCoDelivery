import React, { useState } from 'react';
import Spinner from '../users/Spinner';
import { dbPost } from './Admin';
import PlaceAutocomplete from '../users/address/PlaceAutocomplete';
import Button from '../common/Button';

function SuggestRestaurant() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function submitRestaurant(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = e.target;
        const inputs = {
          name: form.elements['name'].value,
          category: form.elements['category'].value,
          address: form.elements['address'].value,
          latitude: form.elements['latitude'].value,
          longitude: form.elements['longitude'].value,
        };
        try {
            const response = await dbPost(e, form, inputs, "suggestRestaurant");
            if (response.status >= 200 && response.status < 300) {
                setSuccess(true);
                // Reset form
                form.reset();
                setTimeout(() => {
                    setSuccess(false);
                }, 5000);
            } else {
                console.error("Server returned an error:", response.statusText);
                setError(response.data?.error || "Failed to submit suggestion");
            }
        } catch (err) {
            console.error("Error submitting restaurant suggestion:", err);
            setError(err.response?.data?.error || err.message || "Failed to submit suggestion");
            setTimeout(() => {
                setError("");
            }, 5000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={(e) => submitRestaurant(e)}>
            <div className="flex flex-wrap p-6 shadow-lg rounded-xl bg-gradient-to-r from-blue-500 to-yellow-500">
                <div className="w-full mb-4">
                    <h3 className="text-white">Suggest a Restaurant</h3>
                    <p className="text-white text-sm mt-2 opacity-90">
                        Submit a restaurant suggestion for review. It will be reviewed by an administrator before being added to the platform.
                    </p>
                </div>
                <div className="flex flex-wrap xl:flex-nowrap gap-4 w-full items-end">
                    <div className="w-full xl:flex-none xl:w-72 xl:min-w-0">
                        <b className="block mb-2 text-white">Name: </b>
                        <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            name="name"
                            type="text"
                            required
                        />
                    </div>
                    <div className="w-full xl:flex-none xl:w-72 xl:min-w-0">
                        <b className="block mb-2 text-white">Category: </b>
                        <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            name="category"
                            type="text"
                            placeholder="e.g., Pizza, Mexican, Italian"
                            required
                        />
                    </div>
                    <div className="w-full xl:flex-1 xl:min-w-[18rem]">
                        <b className="block mb-2 text-white">Address: </b>
                        <PlaceAutocomplete
                            className="bg-gray-900 text-white"
                            onPlaceSelected={({ address, latitude, longitude }) => {
                                document.querySelector('[name="address"]').value = `${address.streetNumber} ${address.street}, ${address.city}, ${address.state} ${address.zip}`;
                                document.querySelector('[name="latitude"]').value = latitude;
                                document.querySelector('[name="longitude"]').value = longitude;
                            }}
                        />
                    </div>
                    <div className="w-full xl:flex-shrink-0 xl:w-auto">
                        <Button 
                            type="submit" 
                            variant="secondary"
                            size="sm"
                            fullWidth
                            className="xl:w-auto whitespace-nowrap"
                            loading={loading}
                        >
                            <i className="bi bi-plus me-2"> </i>
                            Submit Suggestion
                        </Button>
                    </div>
                </div>
                <input type="hidden" value="" name="address" />
                <input type="hidden" value="" name="latitude" />
                <input type="hidden" value="" name="longitude" />
                <div className="w-full mt-2">
                    {loading ? <Spinner /> : ""}
                    {success ? (
                        <p className="text-green-600 mt-2">
                            <i className="bi bi-check-circle-fill"> </i>
                            Restaurant suggestion submitted successfully! It will be reviewed by an administrator.
                        </p>
                    ) : ""}
                    {error && (
                        <p className="text-red-600 mt-2">
                            <i className="bi bi-exclamation-triangle"> </i>
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}

export default SuggestRestaurant;
