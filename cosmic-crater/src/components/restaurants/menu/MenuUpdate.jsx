import React, { useEffect, useState } from 'react';
import MenuItemWithIngredients from "./menu_items/MenuItemWithIngredients";
import NewMenuItem from "./menu_items/NewMenuItem";

const MenuUpdate = () => {
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
            <div className="flex flex-wrap">
                <div className="w-full">
                    <NewMenuItem
                        setLoading3={setLoading3}
                        setMenuItems={setMenuItems}
                    />
                </div>
            </div>
            <div className="flex flex-wrap">
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
export default MenuUpdate;