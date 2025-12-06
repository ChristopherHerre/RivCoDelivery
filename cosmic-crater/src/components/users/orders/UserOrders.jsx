import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Spinner from '../Spinner';

function UserOrders() {
    const [userOrders, setUserOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const profile = JSON.parse(localStorage.getItem('profile'));
    const googleId = profile ? profile.sub : null;
    const USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    useEffect(() => {
        const fetchUserOrders = async (attempt = 1) => {
            if (googleId) {
                setLoading(true);
                try {
                    const res = await axios.get('/api/user/orders', {
                        headers: {
                            Authorization: `Bearer ${googleId}`
                        },
                        params: {
                            page,
                            limit: 10
                        },
                        withCredentials: true
                    });
                    console.log('User orders:', res.data);
                    setUserOrders(res.data);
                    res.data.forEach(order => {
                        fetchOrderItems(order.id);
                    });
                } catch (err) {
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        fetchUserOrders(attempt + 1);
                    } else {
                        console.error('Error fetching user orders:', err);
                    }
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserOrders();
    }, [googleId, page]);

    const fetchOrderItems = async (orderId, attempt = 1) => {
        try {
            const res = await axios.get('/api/order_items', {
                params: { oid: orderId }
            });
            setOrderItems(prevState => ({
                ...prevState, [orderId]: res.data
            }));
        } catch (err) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                fetchOrderItems(orderId, attempt + 1);
            } else {
                console.error('Error fetching order items:', err);
            }
        }
    };

    function Pages() {
        const handleNextPage = () => {
            setPage(prevPage => prevPage + 1);
        };
    
        const handlePreviousPage = () => {
            setPage(prevPage => Math.max(prevPage - 1, 1));
        };
        return (
            <div className="flex items-center justify-center gap-4 my-4">
                <button 
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handlePreviousPage} 
                        disabled={page === 1}>
                    Previous
                </button>
                <b>Page {page}</b>
                <button 
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                        onClick={handleNextPage}>
                    Next
                </button>
            </div>
        );
    }
    return (
        <div>
            <h1>Your Orders</h1>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {userOrders.length > 0 ? <Pages /> : ""}
                    {userOrders.length > 0 ? (
                        userOrders.map(order => (
                            <div key={order.id} className="flex flex-wrap mb-4">
                                <div className="w-full">
                                    <h5 className="bg-gray-900 text-white text-center p-1">
                                        {order.restaurant} - {order.restaurant_address}
                                    </h5>
                                </div>
                                <div className="w-full lg:w-1/2">
                                    <div className="currency-item">
                                        <b className="label">Date: </b>
                                        <span className="amount">
                                            {new Intl.DateTimeFormat('en-US', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                                timeZone: "America/Los_Angeles"
                                            }).format(new Date(order.date))}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Your Address: </b>
                                        <span className="amount">
                                            {order.address}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Restaurant's Address: </b>
                                        <span className="amount">
                                            {order.restaurant_address}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Delivery Type: </b>
                                        <span className="amount">
                                            {order.business_type}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Knock Type: </b>
                                        <span className="amount">
                                            {order.knock_type}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Instructions: </b>
                                        <span className="amount">
                                            {order.instructions}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Subotal: </b>
                                        <span className="amount">
                                            {USDollar.format(order.subtotal)}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Delivery Fee: </b>
                                        <span className="amount">
                                            {USDollar.format(order.delivery_fee)}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Tax: </b>
                                        <span className="amount">
                                            {USDollar.format(order.tax)}
                                        </span>
                                    </div>
                                    <div className="currency-item">
                                        <b className="label">Total: </b>
                                        <span className="amount">
                                            {USDollar.format(order.total)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full lg:w-1/2">
                                    <table className="w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-200">
                                                <th className="border border-gray-300 p-2">Item</th>
                                                <th className="border border-gray-300 p-2">Quantity</th>
                                                <th className="border border-gray-300 p-2">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems[order.id] ? orderItems[order.id].map(item => (
                                                <>
                                                    <tr key={item.id} className="even:bg-gray-100">
                                                        <td className="border border-gray-300 p-2">{item.name}</td>
                                                        <td className="border border-gray-300 p-2">{item.quantity}</td>
                                                        <td className="border border-gray-300 p-2">{USDollar.format(item.price)}</td>
                                                    </tr>
                                                    {item.ingredients && item.ingredients.trim() !== '' ? (
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">
                                                                {item.ingredients
                                                                    .trim()
                                                                    .replace(/^\[+|\]+$/g, '')
                                                                    .split('] [')
                                                                    .map((part, index) => (
                                                                        <div key={index}>[{part}]</div>
                                                                    ))}
                                                            </td>
                                                            <td className="border border-gray-300 p-2"></td>
                                                            <td className="border border-gray-300 p-2"></td>
                                                        </tr>
                                                    ) : null}
                                                </>
                                            )) : (
                                                <tr>
                                                    <td colSpan="3">
                                                        <Spinner />
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No orders found.</p>
                    )}
                    {userOrders.length > 0 ? <Pages /> : ""}
                </>
            )}
        </div>
    );
}

export default UserOrders;