import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from './Spinner';

export async function getFullAddress(address) {
    if (address === undefined) {
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
    //if (streetNumber == null || street == null || city == null || state == null || zip == null)
    //    return null;
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

    async function editAddress(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
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
        <div>
            <b>Deliver to: </b>
            {isLoading ? (
                <Spinner />
            ) : (
                <>
                    {!showGetLocation ? (
                        <mark>{fullAddress}</mark>
                    ) : (
                        <u className="text-danger">
                            Address Required!
                        </u>
                    )}
                    <span> </span>
                    <b>
                        <a href="#" onClick={(e) => editAddress(e)}>
                            <i className="bi bi-pencil-square"></i>
                        </a>
                    </b>
                </>
            )}
        </div>
    );
}
export default DeliveryAddress;