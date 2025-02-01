import React, { useEffect } from 'react';
import axios from 'axios';
import OrderButtons from './OrderButtons';
import { API_URL } from './App';

export function OrderList(props) {
	const orders = props.orders;
	const setOrders = props.setOrders;
	const orderItems = props.orderItems;
	const setOrderItems = props.setOrderItems;
	const USDollar = props.USDollar;

	useEffect(() => {
		console.log("ordersList");
		const fetchOrders = async () => {
			try {
				const res = await axios.get(API_URL + '/api/orders');
				setOrders(res.data);
			} catch (err) {
				console.error('Error fetching orders:', err);
			}
		};
		fetchOrders();
	}, [setOrders]);

	return (
		<>
			<div className="row">
				<div className="col-sm-12">
					<h1>Open Orders</h1>
				</div>
			</div>
			<OrderButtons 
				setOrderItems={setOrderItems} 
				orderItems={orderItems} 
				orders={orders}
				setOrders={setOrders}
				USDollar={USDollar}
			/>
		</>
	);
}

export default OrderList;
