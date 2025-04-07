import React, { useEffect, useState } from 'react';
function Badge(props) {
    const cartAmount = props.cartAmount;
    return (
        cartAmount > 0 ? 
            <span className="badge bg-danger">
                {cartAmount}
            </span>
        : ""
    );
}
export default Badge;