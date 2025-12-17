import React, { useState } from 'react';
import axios from 'axios';
import qs from 'qs';
import ManageRestaurant from './ManageRestaurant';
import MenuUpdate from './menu/MenuUpdate';

export default function Admin(props) {
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    return (
        <div className="w-full">
            <h2 className="mb-4">Admin Panel</h2>
            <div className="mb-6">
                <ManageRestaurant 
                    setLoading={setLoading}
                    success={success}
                    setSuccess={setSuccess}
                    loading2={loading2}
                    setLoading2={setLoading2}
                />
            </div>
            <MenuUpdate />
        </div>
    );
}

export function dbPost(e, form, inputs, route) {
    e.preventDefault();
    const url = "/api/" + route;
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(inputs),
        url,
    };
    return axios(options);
}