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
        <div className="text-center p-6">
            <h1 className="text-green-600 mb-4">
                <i className="bi bi-check-circle-fill"> </i>
                Your order has been received!
            </h1>
            <ol className="mb-4">
                <li>Your delivery driver will be notified shortly.</li>
                <li>We may contact you if there are any issues with your order.</li>
            </ol>
            <button
                onClick={(e)=>homeButton(e)} 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mt-2">
                    Return to Restaurants list
            </button>
        </div>
    );
}
export default Success;