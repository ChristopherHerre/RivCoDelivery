import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import qs from 'qs';
import { API_URL } from '../App';
import ManageRestaurant from './ManageRestaurant';
import ManageMenuItem from './menu_items/ManageMenuItem';
import AddMenuItem from './AddMenuItem';

export default function Admin(props) {
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const Menu = () => {
        const [loading3, setLoading3] = useState(true);
        const [menuItems, setMenuItems] = useState([]);
        useEffect(() => {
            fetch(`/api/menu-items-list`)
                .then(res => res.json())
                .then(data => {
                    setMenuItems(data);
                    setLoading3(false);
                })
                .catch(() => setError('Failed to fetch menu items'));
        }, []);
        return (
            <>
                <div className="row">
                    <div className="col-12">
                        <AddMenuItem 
                            setMenuItems={setMenuItems}
                            //setSuccess={setSuccess}
                            //setLoading={setLoading}
                            //loading={loading}
                            //success={success}
                        />
                    </div>
                </div>
                <div className="row">
                    {Array.isArray(menuItems) && menuItems?.map(item => (
                        <ManageMenuItem 
                            key={item.id} 
                            item={item}
                            menuItems={menuItems}
                            setMenuItems={setMenuItems}
                            loading3={loading3}
                            setLoading3={setLoading3}
                        />
                    ))}
                </div>
            </>
        );
    };
    return (
        <div>
            <h2>Admin Panel</h2>
            <ManageRestaurant 
                setLoading={setLoading}
                success={success}
                setSuccess={setSuccess}
                loading2={loading2}
                setLoading2={setLoading2}
            />
            <Menu />
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
    return axios(options);
}