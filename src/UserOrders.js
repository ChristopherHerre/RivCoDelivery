import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, Spinner, MAX_RETRY_ATTEMPTS } from './App';
function UserOrders() {
    const [userOrders, setUserOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const profile = JSON.parse(localStorage.getItem('profile'));
    const googleId = profile ? profile.sub : null;
    const USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    useEffect(() => {
        const fetchUserOrders = async (attempt = 1) => {
            if (googleId) {
                try {
                    const res = await axios.get(API_URL + '/api/user/orders', {
                        headers: {
                            Authorization: `Bearer ${googleId}`
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
                        window.location.href = '/404-page.html';
                    }
                }
            }
        };

        fetchUserOrders();
    }, [googleId]);

    const fetchOrderItems = async (orderId, attempt = 1) => {
        try {
            const res = await axios.get(API_URL + '/api/order_items', {
                params: { oid: orderId }
            });
            setOrderItems(prevState => ({
                ...prevState,
                [orderId]: res.data
            }));
        } catch (err) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                fetchOrderItems(orderId, attempt + 1);
            } else {
                console.error('Error fetching order items:', err);
                window.location.href = '/404-page.html';
            }
        }
    };

    return (
        <div className="container">
            <h1>Your Orders</h1>
            {userOrders.length > 0 ? (
                userOrders.map(order => (
                    <div key={order.id} className="row mb-4">
                        <div className="col-12">
                            <h3 className="text-bg-dark text-center p-1">
                                {order.restaurant} - {order.restaurant_address}
                            </h3>
                        </div>
                        <div className="col-lg-6">
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
                        <div className="col-lg-6">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems[order.id] ? orderItems[order.id].map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{USDollar.format(item.price)}</td>
                                        </tr>
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
                <Spinner />//<p>No orders found.</p>
            )}
        </div>
    );
}

export default UserOrders;
