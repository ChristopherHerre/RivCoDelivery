import React, { useEffect, useState } from 'react';
function Failure() {
    return (
        <div className="text-center">
            <h1>
                <span className="text-red-600">
                    <i className="bi bi-exclamation-triangle"> </i>
                    There was an error! Your order was not placed.
                </span>
            </h1>
            <h2>Troubleshooting</h2>
            <ol>
                <li>
                    Return to your <b><i className="bi bi-cart"> </i>Cart </b>
                    to try again.
                </li>
                <li>Try to place your order at a later time if the service is down temporarily for maintainence.</li>
                <li>Contact customer support and describe the issue or include a screenshot.</li>
            </ol>
        </div>
    );
}
export default Failure;