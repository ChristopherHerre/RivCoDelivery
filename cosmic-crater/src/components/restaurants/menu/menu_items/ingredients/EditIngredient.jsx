import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from '../../../../users/Spinner';
import NewIngredient from './NewIngredient';
import Ingredient from './Ingredient';

const EditIngredients = React.memo(function EditIngredients(props) {
    const menuItem = props.menuItem;
    const [loading, setLoading] = useState(true);
    const [ingredients, setIngredients] = useState([]);
    useEffect(() => {
        axios.get(`/api/menu/item/ingredients?menuItem=${menuItem}`)
            .then(response => setIngredients(response.data))
            .then(() => setLoading(false))
            .catch(error => console.error('Error fetching ingredients:', error));
    }, []);
    return (
        <>
            {ingredients.length <= 0 &&
                (<p>No ingredients found.</p>)}
            {ingredients.length > 0 && (
                <div className="flex flex-wrap mb-4">
                    <h3 className="text-xl font-bold">
                        Edit Ingredients
                    </h3>
                </div>
            )}
            {loading ? <Spinner /> : ingredients.map((ingredient, index) => {
                const sortedFields = Object.keys(ingredient)
                    .filter((field) => field !== "ingredient_id" && field !== "menu_item_id" && field !== "id")
                    .sort((a, b) => {
                        const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order"];
                        const indexA = order.indexOf(a);
                        const indexB = order.indexOf(b);
                        if (indexA === -1 && indexB === -1)
                            return a > b ? 1 : -1;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                    console.log("sortedFields: " + sortedFields);
                return (
                    <Ingredient 
                        sortedFields={sortedFields} 
                        ingredient={ingredient} 
                        ingredients={ingredients}
                        setIngredients={setIngredients}
                        index={index}
                    />
                );
            })}
            <div className="flex flex-wrap bg-gray-900 text-white">
                <div className="w-full">
                    <NewIngredient
                        menuItem={menuItem}
                        setIngredients={setIngredients}
                    />
                </div>
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    return prevProps.menuItem === nextProps.menuItem;
});

export default EditIngredients;