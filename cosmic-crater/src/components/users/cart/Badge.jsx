import React from 'react';
import MuiBadge from '@mui/material/Badge';

function Badge(props) {
    const cartAmount = props.cartAmount;
    return (
        cartAmount > 0 ? 
            <MuiBadge badgeContent={cartAmount} color="error" />
        : null
    );
}
export default Badge;