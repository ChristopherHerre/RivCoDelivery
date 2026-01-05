import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import Button from '../../common/Button';
import TruncatedAddress from '../../common/TruncatedAddress';
import DeliveryAddressSkeleton from '../../common/DeliveryAddressSkeleton';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
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

    // Close dropdown when clicking outside (but not when clicking the button itself)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            // Use click instead of mousedown and add a small delay to let button click toggle first
            const timeoutId = setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 100);
            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('click', handleClickOutside);
            };
        }
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
        <div className="text-xs sm:text-sm md:text-base flex items-center gap-2">
            {isLoading ? (
                <DeliveryAddressSkeleton />
            ) : (
                <div className={`dropdown dropdown-center ${dropdownOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
                    <Button
                        variant={!showGetLocation ? "primary" : "danger"}
                        size="md"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(!dropdownOpen);
                        }}
                        className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm md:text-base max-[320px]:!px-2 max-[320px]:!py-1 max-[320px]:!text-xs"
                        aria-label="Delivery address menu"
                        aria-expanded={dropdownOpen}
                        title={fullAddress}
                    >
                        <b className="font-semibold">Deliver to:</b>
                        <TruncatedAddress 
                            address={fullAddress} 
                            fallback="Address Required!"
                        />
                        <i className={`bi bi-chevron-down transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
                    </Button>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-primary text-primary-content rounded-box z-[200] w-52 p-2 shadow-lg border border-primary mt-2"
                    >
                        <li>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    editAddress(e);
                                    setDropdownOpen(false);
                                }}
                                className="text-primary-content hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-primary-content focus:ring-offset-2 focus:ring-offset-primary"
                            >
                                <i className="bi bi-pencil-square"></i>
                                <span className="text-primary-content">Edit Address</span>
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
export default DeliveryAddress;