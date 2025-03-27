import React, { } from 'react';
import EditIngredients from './EditIngredient';
import EditItem from './EditItem';

function ManageMenuItem(props) {
    const item = props.item;
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    return (
        <div key={item.id} className="col-12 mt-3 shadow-lg rounded-2">
            <div className="row p-2">
                <div className='col-12 col-xl-3 bg-primary-subtle rounded-1'>
                    <EditItem
                        key={item.id}
                        item={item}
                        menuItems={menuItems}
                        setMenuItems={setMenuItems}
                    /> 
                </div>
                <div className='col-12 col-xl-9'>
                    <EditIngredients menuItem={item.id} />
                </div>
            </div>
        </div>
    );
}
export default ManageMenuItem;