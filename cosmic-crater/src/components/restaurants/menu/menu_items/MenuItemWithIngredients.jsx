import React, { useState } from 'react';
import EditIngredients from './ingredients/EditIngredient';
import EditItem from './EditItem';
import ResponsiveFlexRow from '../../../common/ResponsiveFlexRow';

function MenuItemWithIngredients(props) {
    const item = props.item;
    const menuItems = props.menuItems;
    const setMenuItems = props.setMenuItems;
    const loading3 = props.loading3;
    const setLoading3 = props.setLoading3;
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div key={item.id} className="w-full mt-3 shadow-lg border border-gray-300 rounded-lg">
            <div className="bg-gray-100 p-4 cursor-pointer hover:bg-gray-200 transition-colors"
                 onClick={() => setIsExpanded(!isExpanded)}>
                <ResponsiveFlexRow>
                    <h3 className="text-lg font-semibold m-0">{item.name || `Menu Item #${item.id}`}</h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="max-[480px]:ml-0 ml-4 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                        aria-label={isExpanded ? "Minimize" : "Maximize"}
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
                    </button>
                </ResponsiveFlexRow>
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