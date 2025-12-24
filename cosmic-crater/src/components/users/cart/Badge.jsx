import React, { useEffect, useState } from 'react';

function Badge(props) {
    const cartAmount = props.cartAmount;
    return (
        cartAmount > 0 ? 
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem] z-10">
                {cartAmount}
            </span>
        : ""
    );
}
export default Badge;