import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import qs from 'qs';
import ManageRestaurant from './ManageRestaurant';
import MenuItemWithIngredients from './menu_items/MenuItemWithIngredients';
import AddMenuItem from './menu_items/AddMenuItem';

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
        }, [loading3]);
        return (
            <>
                <div className="row">
                    <div className="col-12">
                        <AddMenuItem
                            setLoading3={setLoading3}
                            setMenuItems={setMenuItems}
                        />
                    </div>
                </div>
                <div className="row">
                    {Array.isArray(menuItems) && menuItems?.map(item => (
                        <MenuItemWithIngredients 
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
        <div className="m-1">
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