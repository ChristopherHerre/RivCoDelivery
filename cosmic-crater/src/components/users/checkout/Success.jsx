import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button';

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
            <Button
                onClick={(e)=>homeButton(e)} 
                className="mt-2"
            >
                Return to Restaurants list
            </Button>
        </div>
    );
}
export default Success;