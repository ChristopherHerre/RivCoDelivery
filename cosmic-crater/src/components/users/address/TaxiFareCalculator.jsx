import React, { useState } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete';

function haversine_dist(lat1, lng1, lat2, lng2) {
    const R = 3958.8; // miles
    const rlat1 = lat1 * (Math.PI / 180);
    const rlat2 = lat2 * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(difflat / 2) ** 2 +
              Math.cos(rlat1) * Math.cos(rlat2) *
              Math.sin(difflon / 2) ** 2;

    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
}

export default function TaxiFareCalculator() {
    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);

    const handleFromSelect = (place) => {
        setFrom(place);
    };

    const handleToSelect = (place) => {
        setTo(place);
    };

    const calculateFare = () => {
        if (!from || !to) return null;

        const distance = haversine_dist(from.latitude, from.longitude, to.latitude, to.longitude);
        return {
            distance: distance.toFixed(2),
            fare: (distance * 0.75).toFixed(2)
        };
    };

    const fareDetails = calculateFare();

    return (
        <div className="row p-1 bg-dark text-white">
            <h3 className="text-white mb-4">🚕 Taxi Fare Calculator</h3>

            <div className="col-12 col-md-6 mb-3">
                <label><strong>From:</strong></label>
                <PlaceAutocomplete onPlaceSelected={handleFromSelect} />
            </div>

            <div className="col-12 col-md-6 mb-3">
                <label><strong>To:</strong></label>
                <PlaceAutocomplete onPlaceSelected={handleToSelect} />
            </div>

            {fareDetails && (
                <div className="mt-4">
                    <h5 className='text-white' >📏 Distance: {fareDetails.distance} miles</h5>
                    <h4 className='text-white '>💰 Estimated Fare: ${fareDetails.fare}</h4>
                </div>
            )}
        </div>
    );
}
