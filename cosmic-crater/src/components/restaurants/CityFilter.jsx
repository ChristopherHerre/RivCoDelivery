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
                <div className="form-control">
                    <label className="label">
                        <span className="label-text text-base-content">Filter by City:</span>
                    </label>
                    <span className="text-sm text-base-content/50">Loading cities...</span>
                </div>
            </div>
        );
    }

    if (cities.length === 0) {
        return null;
    }

    return (
        <div className="w-full md:w-auto flex-shrink-0">
            <div className="form-control">
                <div className="label block justify-between items-center">
                    <span className="label-text text-base-content">Filter by City:</span>
                    {selectedCities.length > 0 && (
                        <span className="badge badge-primary badge-sm" aria-label={`${selectedCities.length} ${selectedCities.length === 1 ? 'city' : 'cities'} selected`}>
                            {selectedCities.length}
                        </span>
                    )}
                </div>
                {selectedCities.length > 0 && (
                    <button
                        onClick={() => onCityChange([])}
                        className="btn btn-sm btn-link text-xs mb-2 p-0 h-auto min-h-0"
                        aria-label="Clear all city filters"
                    >
                        Clear all
                    </button>
                )}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {selectedCities.length > 0 ? `${selectedCities.length} ${selectedCities.length === 1 ? 'city' : 'cities'} selected` : 'No cities selected'}
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto" role="group" aria-label="City filters">
                    <div className="flex flex-col gap-2">
                        {cities.map((city) => (
                            <label key={city.city_slug} className={`label cursor-pointer gap-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-base-100 rounded transition-all duration-200 ease-in-out hover:bg-base-200/50 px-2 py-2 min-h-[44px] ${selectedCities.includes(city.city_slug) ? 'bg-primary/10' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedCities.includes(city.city_slug)}
                                    onChange={() => handleCityToggle(city.city_slug)}
                                    className="checkbox checkbox-primary checkbox-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 min-w-[20px] min-h-[20px]"
                                    aria-label={`Filter by ${city.city_name}`}
                                />
                                <span className={`label-text ${selectedCities.includes(city.city_slug) ? 'text-primary font-semibold' : 'text-base-content'}`}>
                                    {city.city_name}
                                    {selectedCities.includes(city.city_slug) && (
                                        <i className="bi bi-check-circle-fill text-primary ml-1" aria-hidden="true"></i>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

