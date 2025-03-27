import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import qs from 'qs';
import { API_URL } from '../App';
import Spinner from '../users/Spinner';

function AddIngredient(props) {
    const menu_item_id = props.menuItem;
    const setIngredients = props.setIngredients;
    const [formData, setFormData] = useState({
      easy_price: '',
      extra_price: '',
      inputType: '',
      ingredients_name: '',
      customize: '',
      type: '',
      price: '',
      sort_order: '',
      selected: '',
      halfable: ''
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, [name]: value
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const formDataWithMenuItem = {
            ...formData,
            menu_item_id: menu_item_id,
        };
        axios.post(`${API_URL}/api/menu-item-ingredients`, 
            qs.stringify(formDataWithMenuItem), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then(response => {
            setSuccess('Ingredient added successfully!');
            setError('');
            setFormData({
                easy_price: '',
                extra_price: '',
                inputType: '',
                ingredients_name: '',
                customize: '',
                type: '',
                price: '',
                sort_order: '',
                selected: '',
                halfable: ''
            });
            setIngredients(prevIngredients => [...prevIngredients, response.data.ingredient]);
        })
        .catch(err => {
            setError('Failed to add ingredient');
            setSuccess('');
            console.error(err);
        });
    };
    return (
        <div className="rounded-2 bg-dark text-white">
            <h3 className="text-white">Add New Ingredient</h3>
            {success &&
                <p className="text-success">
                    <i className="bi bi-check-circle-fill"> </i>
                    {success}
                </p>
            }
            { error && <p className="text-danger">{error}</p> }
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {Object.keys(formData).sort((a, b) => {
                        const order = ["id", "type", "ingredients_name", "price", "easy_price", "extra_price", "customize", "halfable", "selected", "sort_order"];
                        const indexA = order.indexOf(a);
                        const indexB = order.indexOf(b);
                        if (indexA === -1 && indexB === -1) return a > b ? 1 : -1;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    }).map((key) => (
                        <div className="col-12 col-md-3" key={key}>
                            <strong>{key}:</strong>
                            <input 
                                type={key.includes('price') || key === 'sort_order' || key === 'inputType' ? 'number' : 'text'}
                                name={key} 
                                value={formData[key]} 
                                onChange={handleChange}
                                className="form-control bg-dark text-white" 
                            />
                        </div>
                    ))}
                    <div className='col-12 col-md-3'>
                        <br />
                        <button type="submit" className="btn btn-primary form-control">
                            <i class="bi bi-plus-lg"> </i>
                            Add Ingredient
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
export default AddIngredient;