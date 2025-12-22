import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Carousel, { CarouselItem } from '../common/Carousel';

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
                <label className="label block">
                    <span className="label-text text-base-content">Filter by City:</span>
                </label>
                <div className="mt-2 px-4">
                    <Carousel id="city-filter-carousel" scrollAmount={200} space="space-x-2" carouselClassName="px-12">
                        {cities.map((city) => (
                            <CarouselItem key={city.city_slug}>
                                <label className="label cursor-pointer gap-2 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedCities.includes(city.city_slug)}
                                        onChange={() => handleCityToggle(city.city_slug)}
                                        className="checkbox checkbox-primary checkbox-sm"
                                    />
                                    <span className="label-text text-base-content">{city.city_name}</span>
                                </label>
                            </CarouselItem>
                        ))}
                    </Carousel>
                </div>
            </div>
        </div>
    );
}

