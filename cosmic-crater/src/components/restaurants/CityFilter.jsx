import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CityFilter({ selectedCities, onCityChange }) {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await axios.get('/api/restaurant-cities');
                setCities(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching cities:', error);
                setLoading(false);
            }
        };

        fetchCities();
    }, []);

    const handleCityToggle = (citySlug) => {
        if (selectedCities.includes(citySlug)) {
            // Remove city from selection
            onCityChange(selectedCities.filter(slug => slug !== citySlug));
        } else {
            // Add city to selection
            onCityChange([...selectedCities, citySlug]);
        }
    };

    if (loading) {
        return (
            <div className="w-full md:w-auto">
                <div className="px-3 py-2 text-gray-400 text-sm">Loading cities...</div>
            </div>
        );
    }

    if (cities.length === 0) {
        return null;
    }

    return (
        <div className="w-full md:w-auto">
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-900">
                <div className="text-white text-sm font-semibold mb-2">Filter by City:</div>
                <div className="flex flex-wrap gap-3">
                    {cities.map((city) => (
                        <label
                            key={city.city_slug}
                            className="flex items-center cursor-pointer text-sm text-white hover:text-blue-400 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCities.includes(city.city_slug)}
                                onChange={() => handleCityToggle(city.city_slug)}
                                className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                            <span>{city.city_name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

