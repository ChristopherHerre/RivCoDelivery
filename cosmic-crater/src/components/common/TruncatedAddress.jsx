import React, { useEffect, useState, useCallback } from 'react';

/**
 * TruncatedAddress component
 * Displays an address with responsive truncation based on screen size
 * 
 * @param {Object} props
 * @param {string} props.address - The full address string to display
 * @param {string} props.className - Additional CSS classes to apply
 * @param {string} props.fallback - Fallback text if address is empty (default: "")
 */
export default function TruncatedAddress({ address, className = '', fallback = '' }) {
    const [displayAddress, setDisplayAddress] = useState('');

    // Function to truncate address based on screen size
    const truncateAddress = useCallback((addressText, screenWidth) => {
        if (!addressText) return fallback;
        // Define max lengths for different screen sizes
        if (screenWidth >= 1024) { // lg and above
            return addressText.length > 50 ? addressText.slice(0, 50) + "..." : addressText;
        } else if (screenWidth >= 640) { // sm to md
            return addressText.length > 35 ? addressText.slice(0, 35) + "..." : addressText;
        } else if (screenWidth >= 315) { // xs (315px to 640px)
            return addressText.length > 15 ? addressText.slice(0, 15) + "..." : addressText;
        } else if (screenWidth >= 280) { // very small screens (280px to 315px)
            return addressText.length > 10 ? addressText.slice(0, 10) + "..." : addressText;
        } else if (screenWidth >= 275) { // extremely small screens (275px to 280px)
            return addressText.length > 9 ? addressText.slice(0, 9) + "..." : addressText;
        } else if (screenWidth >= 270) { // ultra small screens (270px to 275px)
            return addressText.length > 8 ? addressText.slice(0, 8) + "..." : addressText;
        } else if (screenWidth >= 265) { // very ultra small screens (265px to 270px)
            return addressText.length > 7 ? addressText.slice(0, 7) + "..." : addressText;
        } else if (screenWidth >= 260) { // extremely ultra small screens (260px to 265px)
            return addressText.length > 6 ? addressText.slice(0, 6) + "..." : addressText;
        } else if (screenWidth >= 255) { // minimum small screens (255px to 260px)
            return addressText.length > 5 ? addressText.slice(0, 5) + "..." : addressText;
        } else { // absolute minimum screens (under 255px)
            return addressText.length > 4 ? addressText.slice(0, 4) + "..." : addressText;
        }
    }, [fallback]);

    // Update displayed address when address or window size changes
    useEffect(() => {
        const updateDisplayAddress = () => {
            if (address) {
                setDisplayAddress(truncateAddress(address, window.innerWidth));
            } else {
                setDisplayAddress(fallback);
            }
        };

        updateDisplayAddress();
        window.addEventListener('resize', updateDisplayAddress);
        return () => window.removeEventListener('resize', updateDisplayAddress);
    }, [address, truncateAddress, fallback]);

    return (
        <span 
            className={className}
            title={address || fallback}
        >
            {displayAddress || address || fallback}
        </span>
    );
}

