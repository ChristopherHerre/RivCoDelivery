import React, { useEffect } from 'react';
import { CartItemDetails, calcSubtotal, Subtotal } from '../cart/Cart';
import { roundedToFixed } from '../../App';
import currency from 'currency.js';

export default function OrderReview(props) {
  const cart = props.cart;
  const subtotal = props.subtotal;
  const deliveryFee = props.deliveryFee;
  const USDollar = props.USDollar;
  const tax = props.tax;
  const setTax = props.setTax;
  const total = props.total;
  const setTotal = props.setTotal;

  useEffect(() => {
    setTax((currency(deliveryFee).add(currency(subtotal)) * 0.09));
    setTotal(currency(deliveryFee).add((currency(deliveryFee).add(currency(subtotal))) * 0.09).add(currency(subtotal)));
  }, [deliveryFee, subtotal]);

  return (
    <div className="flex flex-wrap m-1">
      <div className="w-full text-center p-1">
        <h3>Order Review</h3>
      </div>
      <div className="w-full md:w-7/12 md:pr-4">
        {cart.map((ci, key) => (
          <div key={key} className="cartitem p-3">
            <CartItemDetails USDollar={USDollar} cartItem={ci} />
          </div>
        ))}
      </div>
      <div className="w-full md:w-5/12">
        <Subtotal USDollar={USDollar} subtotal={subtotal} />
        <h4 className="currency-item">
          <span className="label">Service Fee:</span>
          <b className="amount">{USDollar.format(roundedToFixed(deliveryFee, 2))}</b>
        </h4>
        <h4 className="currency-item">
          <span className="label">Tax:</span>
          <b className="amount">{USDollar.format(roundedToFixed(tax, 2))}</b>
        </h4>
        <h4 className="currency-item">
          <span className="label">Total:</span>
          <b className="amount">{USDollar.format(total)}</b>
        </h4>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full">Place order</button>
      </div>
    </div>
  );
}