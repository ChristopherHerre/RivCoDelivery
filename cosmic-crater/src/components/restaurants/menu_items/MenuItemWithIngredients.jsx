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
        <div key={item.id} className="col-12 mt-3 shadow-lg">
            <div className="row p-2">
                <div className='col-12 col-xl-3 bg-primary-subtle rounded-4'>
                    <EditItem
                        key={item.id}
                        item={item}
                        menuItems={menuItems}
                        setMenuItems={setMenuItems}
                        loading3={loading3}
                        setLoading3={setLoading3}
                    /> 
                </div>
                <div className='col-12 col-xl-9'>
                    <EditIngredients menuItem={item.id} />
                </div>
            </div>
        </div>
    );
}
export default MenuItemWithIngredients;