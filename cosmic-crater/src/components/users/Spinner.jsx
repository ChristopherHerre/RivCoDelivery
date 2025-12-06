import React, { useEffect, useState } from 'react';
const Spinner = (props) => {
    return (
        <div className="flex justify-center">
            <div className="m-2">
                <div 
                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" 
                        role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        </div>
    );
}
export default Spinner;