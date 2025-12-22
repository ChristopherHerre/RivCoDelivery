import React, { useState } from 'react';
import EditIngredients from './ingredients/EditIngredient';
import EditItem from './EditItem';
import Button from '../../../common/Button';

function MenuItemWithIngredients(props) {
    const item = props.item;
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const loading3 = props.loading3;
    const setLoading3 = props.setLoading3;
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div key={item.id} className="w-full mt-3">
            <div 
                className="flex justify-between items-center cursor-pointer hover:opacity-90 transition-opacity p-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-lg font-semibold m-0 text-base-content">{item.name || `Menu Item #${item.id}`}</h3>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    variant="secondary"
                    size="sm"
                    className="max-[480px]:ml-0 ml-4"
                    ariaLabel={isExpanded ? "Minimize" : "Maximize"}
                >
                    {isExpanded ? (
                        <>
                            <i className="bi bi-chevron-up"></i>
                            <span>Minimize</span>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-chevron-down"></i>
                            <span>Maximize</span>
                        </>
                    )}
                </Button>
            </div>
            {isExpanded && (
                <div className="flex flex-wrap">
                    <div className='w-full xl:w-1/4 bg-blue-50 p-4'>
                        <EditItem
                            key={item.id}
                            item={item}
                            menuItems={menuItems}
                            setMenuItems={setMenuItems}
                            loading3={loading3}
                            setLoading3={setLoading3}
                        /> 
                    </div>
                    <div className='w-full xl:w-3/4 p-4'>
                        <EditIngredients menuItem={item.id} />
                    </div>
                </div>
            )}
        </div>
    );
}
export default MenuItemWithIngredients;