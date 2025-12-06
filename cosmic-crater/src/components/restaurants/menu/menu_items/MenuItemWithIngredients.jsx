import React from 'react';
import EditIngredients from './ingredients/EditIngredient';
import EditItem from './EditItem';

function MenuItemWithIngredients(props) {
    const item = props.item;
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const loading3 = props.loading3;
    const setLoading3 = props.setLoading3;
    return (
        <div key={item.id} className="w-full mt-3 shadow-lg">
            <div className="flex flex-wrap">
                <div className='w-full xl:w-1/4 bg-blue-50'>
                    <EditItem
                        key={item.id}
                        item={item}
                        menuItems={menuItems}
                        setMenuItems={setMenuItems}
                        loading3={loading3}
                        setLoading3={setLoading3}
                    /> 
                </div>
                <div className='w-full xl:w-3/4'>
                    <EditIngredients menuItem={item.id} />
                </div>
            </div>
        </div>
    );
}
export default MenuItemWithIngredients;