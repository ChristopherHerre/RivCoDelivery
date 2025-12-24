import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Spinner from '../Spinner';

export async function getFullAddress(address) {
    if (!address || !address.streetNumber || !address.zip) {
        try {
            const response = await axios.get(`/api/user/full-address`, {
                withCredentials: true
            });
            address = response.data.address;
        } catch (error) {
            console.error('Error fetching address:', error);
            return "Error";
        }
    }
    const streetNumber = address.streetNumber + " ";
    const street = address.street ? address.street + ", " : "";
    const city = address.city ? address.city + ", " : "";
    const state = address.state ? address.state + " " : "";
    const zip = address.zip;
    return streetNumber + street + city + state + zip;
}

function DeliveryAddress(props) {
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const address = props.address;
    const setAddress = props.setAddress;
    const [fullAddress, setFullAddress] = useState("");
    const [displayAddress, setDisplayAddress] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Function to truncate address based on screen size
    const truncateAddress = (address, screenWidth) => {
        if (!address) return "";
        // Define max lengths for different screen sizes
        if (screenWidth >= 1024) { // lg and above
            return address.length > 50 ? address.slice(0, 50) + "..." : address;
        } else if (screenWidth >= 640) { // sm to md
            return address.length > 35 ? address.slice(0, 35) + "..." : address;
        } else { // xs
            return address.length > 20 ? address.slice(0, 20) + "..." : address;
        }
    };

    // Update displayed address when fullAddress or window size changes
    useEffect(() => {
        const updateDisplayAddress = () => {
            if (fullAddress) {
                setDisplayAddress(truncateAddress(fullAddress, window.innerWidth));
            }
        };

        updateDisplayAddress();
        window.addEventListener('resize', updateDisplayAddress);
        return () => window.removeEventListener('resize', updateDisplayAddress);
    }, [fullAddress]);
    useEffect(() => {
        const loadAddress = async () => {
            setError(null);
            try {
                const addr = await getFullAddress(address);
                if (addr != undefined) {
                    setFullAddress(addr);
                    console.log("addr: " + addr);
                }
                if (addr != undefined &&
                    addr.length > 0 &&
                    !addr.includes("null"))
                {
                    setShowGetLocation(false);
                } else {
                    setShowGetLocation(true);
                }
            } catch (error) {
                console.error("Error loading address:", error);
                setShowGetLocation(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadAddress();
    }, [address, setFullAddress, setShowGetLocation]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    async function editAddress(e) {
        e.preventDefault();
        // Retrieve the CSRF token from cookie
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN='))
          ?.split('=')[1];
    
        try {
            const response = await fetch('/api/user/address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken // include the token here
                },
                credentials: 'include',
                body: JSON.stringify({
                    address,
                    fullAddress,
                })
            });
    
            const result = await response.json();
            if (result.success) {
                setShowGetLocation(true);
                setAddress("");
                setFullAddress("");
                navigate("/");
            } else {
                console.error('Failed to update address');
            }
        } catch (error) {
            console.error('Error updating address:', error);
        }
    }
    
    return (
        <div className="text-sm md:text-base flex items-center gap-2 flex-wrap">
            {isLoading ? (
                <Spinner />
            ) : (
                <div className={`dropdown dropdown-end ${dropdownOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
                    <button
                        tabIndex={0}
                        className="flex items-center justify-between gap-2 w-full text-sm md:text-base hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded-lg p-1"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-label="Delivery address menu"
                        aria-expanded={dropdownOpen}
                    >
                        <b className="text-base-content font-semibold">Deliver to:</b>
                        {!showGetLocation ? (
                            <span className="badge badge-primary badge-lg text-primary-content px-3 py-2 flex items-center gap-2">
                                <span className="whitespace-nowrap" title={fullAddress}>{displayAddress || fullAddress}</span>
                                <i className={`bi bi-chevron-down text-primary-content transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                            </span>
                        ) : (
                            <span className="badge badge-error badge-lg text-error-content px-3 py-2 flex items-center gap-2">
                                <span>Address Required!</span>
                                <i className={`bi bi-chevron-down text-error-content transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                            </span>
                        )}
                    </button>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-[100] w-52 p-2 shadow-lg border border-base-300 mt-2"
                    >
                        <li>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    editAddress(e);
                                    setDropdownOpen(false);
                                }}
                                className="text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100"
                            >
                                <i className="bi bi-pencil-square"></i>
                                <span className="text-base-content">Edit Address</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
export default DeliveryAddress;