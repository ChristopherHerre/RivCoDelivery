import React, { useEffect, useState } from 'react';
const Spinner = (props) => {
    return (
        <div className="row text-center">
            <div className="col-12">
                <div 
                        className="spinner-border m-2" 
                        role="status">
                    <span className="sr-only"></span>
                </div>
            </div>
        </div>
    );
}
export default Spinner;