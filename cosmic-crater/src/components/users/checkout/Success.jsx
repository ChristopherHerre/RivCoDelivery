import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Success() {
    const navigate = useNavigate();
    const homeButton = (e) => {
        e.preventDefault();
        navigate("/");
    }
    useEffect(() => {
        console.log("#### Success useEffect ####");
    }
    , []);
    return (
        <div className="text-center">
            <h1 className="text-success">
                <i className="bi bi-check-circle-fill"> </i>
                Your order has been received!
            </h1>
            <ol>
                <li>Your delivery driver will be notified shortly.</li>
                <li>We may contact you if there are any issues with your order.</li>
            </ol>
            <button
                onClick={(e)=>homeButton(e)} 
                className="btn btn-primary mt-2">
                    Return to Restaurants list
            </button>
        </div>
    );
}
export default Success;