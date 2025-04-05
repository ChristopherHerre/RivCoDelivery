import React, { useState } from 'react';
import Spinner from '../users/Spinner';
import { dbPost } from './Admin';

function AddMenuItem(props) {
    const setMenuItems = props.setMenuItems;
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        size1: '',
        price2: '',
        size2: '',
        price3: '',
        size3: '',
        price4: '',
        size4: '',
        sort: 2
    });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    async function submitMenuItem(e) {
        e.preventDefault();
        setLoading(true);
        const inputs = { ...formData, restaurant_id: null }; // Will be set server-side
        try {
            const response = await dbPost(e, e.target, inputs, "add-menu-item");
            if (response.status >= 200 && response.status < 300) {
                setSuccess(true);
                setMenuItems(prevMenuItems => [...prevMenuItems, ...formData]);
                setFormData({
                    name: '',
                    category: '',
                    price: '',
                    size1: '',
                    price2: '',
                    size2: '',
                    price3: '',
                    size3: '',
                    price4: '',
                    size4: '',
                    sort: 2
                });
                setTimeout(() => setSuccess(false), 2000);
            }
        } catch (err) {
            console.error("Error submitting menu item:", err);
        } finally {
            setLoading(false);
        }
    }
    return (
        <form onSubmit={submitMenuItem} className="row p-2 shadow-lg rounded-2xl bg-dark text-white mt-3">
            <h3 className="text-white">Add New Menu Item</h3>
            <div className="col-12 col-md-3">
                <b>Name:</b>
                <input
                    className="form-control bg-dark text-white"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="col-12 col-md-3">
                <b>Category:</b>
                <input
                    className="form-control bg-dark text-white"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="col-12 col-md-3">
                <b>Sort:</b>
                <input
                    className="form-control bg-dark text-white"
                    name="sort"
                    value={formData.sort}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="col-12 col-md-3">
                <b>Price:</b>
                <input
                    type="number"
                    step="0.01"
                    className="form-control bg-dark text-white"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                />
            </div>
            {/* Size and Price Fields */}
            {[1, 2, 3].map((num) => (
                <React.Fragment key={num}>
                    <div className="col-12 col-md-3">
                        <b>Size{num}:</b>
                        <input
                            className="form-control bg-dark text-white"
                            name={`size${num}`}
                            value={formData[`size${num}`]}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-12 col-md-3">
                        <b>Price{num + 1}:</b>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control bg-dark text-white"
                            name={`price${num + 1}`}
                            value={formData[`price${num + 1}`]}
                            onChange={handleChange}
                        />
                    </div>
                </React.Fragment>
            ))}
            <div className="col-12 col-md-3">
                <b>Size4:</b>
                <input
                    className="form-control bg-dark text-white"
                    name={`size4`}
                    value={formData[`size4`]}
                    onChange={handleChange}
                />
            </div>
            <div className="col-12 col-md-3">
                <br />
                <button type="submit" className="btn btn-primary form-control">
                    <i class="bi bi-plus-lg"> </i>
                    Add Menu Item
                </button>
            </div>
            {loading ? <Spinner /> : ""}
            {success && (
                <p className="text-success mt-2">
                    <i className="bi bi-check-circle-fill"></i> Menu item added successfully!
                </p>
            )}
        </form>
    );
}
export default AddMenuItem;