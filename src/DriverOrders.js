import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { dbPost2, API_URL, Spinner, MAX_RETRY_ATTEMPTS } from './App';

function DriverOrders() {
    const [driverOrders, setDriverOrders] = useState([]);
    const [driverOrderItems, setDriverOrderItems] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const profile = JSON.parse(localStorage.getItem('profile'));
    const googleId = profile ? profile.sub : null;
    const USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    useEffect(() => {
        const fetchDriverOrders = async (attempt = 1) => {
            if (googleId) {
                setLoading(true);
                try {
                    const res = await axios.get(API_URL + '/api/orders', {
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
                    setDriverOrders(res.data);
                    res.data.forEach(order => {
                        fetchDriverOrderItems(order.id);
                    });
                } catch (err) {
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        fetchDriverOrders(attempt + 1);
                    } else {
                        console.error('Error fetching user orders:', err);
                        window.location.href = '/404-page.html';
                    }
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchDriverOrders();
    }, [googleId, page]);

    const fetchDriverOrderItems = async (orderId, attempt = 1) => {
        try {
            const res = await axios.get(API_URL + '/api/order_items', {
                params: { oid: orderId }
            });
            setDriverOrderItems(prevState => ({
                ...prevState,
                [orderId]: res.data
            }));
        } catch (err) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                fetchDriverOrderItems(orderId, attempt + 1);
            } else {
                console.error('Error fetching order items:', err);
                window.location.href = '/404-page.html';
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
            <div className="pagination">
                <button 
                        className="btn btn-secondary"
                        onClick={handlePreviousPage} 
                        disabled={page === 1}>
                    Previous
                </button>
                <b>Page {page}</b>
                <button 
                        className="btn btn-secondary"
                        onClick={handleNextPage}>
                    Next
                </button>
            </div>
        );
    }

    async function changeOrderOpen(e, iid) {
		e.preventDefault(e);
		if (e.target.value === "closed") {
			console.log("@! " + e.target.value + " " + iid);
			await dbPost2(e, [iid], "changeOrderOpen");
			setDriverOrderItems([]);
			setDriverOrders(driverOrders.filter(function(o) { 
				return o.id !== iid;
			}));
			e.target.value = "open";
            fetchDriverOrderItems();
		}
	}

    return (
        <div className="container">
            <h1>Driver Orders</h1>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {driverOrders.length > 0 ? <Pages /> : ""}
                    {driverOrders.length > 0 ? (
                        driverOrders.map(order => (
                            <div key={order.id} className="row mb-4">
                                <div className="col-12">
                                    <h4 className="text-bg-dark text-center p-1">
                                        {order.restaurant} - {order.restaurant_address}
                                    </h4>
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
                                    <div className="currency-item">
                                        <b className="label">Status: </b>
                                        <select 
                                            onChange={(e) => changeOrderOpen(e, order.id)}
                                            className="form-control text-bg-dark m-1" 
                                            defaultValue={order.open == 0 ? "open" : "closed" } 
                                        >
                                            <option value="open">Open</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>`
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
                                            {driverOrderItems[order.id] ? driverOrderItems[order.id].map(item => (
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
                        <p>No orders found.</p>
                    )}
                    {driverOrders.length > 0 ? <Pages /> : ""}
                </>
            )}
        </div>
    );
}

export default DriverOrders;