import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { dbPost2, API_URL, Spinner, MAX_RETRY_ATTEMPTS } from './App';

export function OrderButtons(props) {
    const orderItems = props.orderItems;
    const orders = props.orders;
    const setOrders = props.setOrders;
    const setOrderItems = props.setOrderItems;
    const USDollar = props.USDollar;
    const [showInstructions, setShowInstructions] = useState(false);
    const [instructions, setInstructions] = useState("");
    const [knockType, setKnockType] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [fee, setFee] = useState(0.00);
    const [subtotal, setSubtotal] = useState(0.00);
    const [tax, setTax] = useState(0.00);
    const [total, setTotal] = useState(0.00);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const profile = JSON.parse(localStorage.getItem('profile'));
    const googleId = profile ? profile.sub : null;

    useEffect(() => {
        setOrderItems([]);
        setLoading(false);
    }, [setOrderItems]);

    useEffect(() => {
        const fetchOrders = async (attempt = 1) => {
            if (googleId) {
                try {
					const res = await axios.get(API_URL + '/api/orders', {
						headers: {
                            Authorization: `Bearer ${googleId}`
                        },
                        withCredentials: true
                    });
                    setOrders(res.data);
                    setOrdersLoading(false);
                } catch (err) {
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        fetchOrders(attempt + 1);
                    } else {
                        console.error('Error fetching orders:', err);
                    }
                }
            }
        };
        fetchOrders();
    }, [setOrders, googleId]);

    async function getOrderItems(id, instructionsp, knockTypep, businessTypep, f, s, tax, total, attempt = 1) {
        console.log("oid: " + id + " " + instructionsp + " " + knockTypep + " " + f + " " + s + " ");
        setLoading(true);
        try {
            const res = await axios.get(API_URL + '/api/order_items', { params: { oid: id } });
            console.log(res.data);
            setOrderItems(res.data);
            setLoading(false);
        } catch (err) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                getOrderItems(id, instructionsp, knockTypep, businessTypep, f, s, tax, total, attempt + 1);
            } else {
                console.error('Error fetching order items:', err);
                setLoading(false);
            }
        }
        setShowInstructions(true);
        setKnockType(knockTypep);
        setBusinessType(businessTypep);
        setInstructions(instructionsp);
        setFee(f);
        setSubtotal(s);
        setTax(tax);
        setTotal(total);
        console.log("oid: " + id + " " + instructions + " " + knockType + " " + fee + " " + subtotal + " ");
    }

    return (
        <div className="container">
            {ordersLoading ? (
                <Spinner />
            ) : (
                orders?.map(order => (
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
            )}
        </div>
    );
}

export default OrderButtons;