import React, { useEffect, useState } from 'react';

const Donate = (props) => {
    const GoFundMeEmbed = () => {
		return (
			<iframe
				src="https://www.gofundme.com/f/rivcodelivery-customer-and-supplier-management-project/widget/large?sharesheet=managehero&attribution_id=sl:69051672-bc13-4f4b-a0e5-e94edae727d0"
				width="100%"
				height="525"
				frameBorder="0"
				scrolling="no"
				title="GoFundMe"
			></iframe>
		);
	};
    return (<>
        <div className="row">
            <div className="col-12 col-md-6">
                <h1>Donate today to support continued development!</h1>
                <p>Donating even a small amount will help me in developing:</p>
                <ol>
                    <li>New features</li>
                    <li>Bug fixes</li>
                    <li>Better documentation</li>
                    <li>YouTube videos and tutorials for installing this project live</li>
                </ol>
                <p>Additionally, I am raising money to pay for hosting for this website and other expenses related to this project.</p>
            </div>
            <div className="col-12 col-md-6 text-end">
                <GoFundMeEmbed />
            </div>
        </div>
        <div className="row bg-dark text-white p-5 m-1">
            <div className="col-12 text-center mx-auto">
                <a href="https://github.com/ChristopherHerre/RivCoDelivery">
                    <button className="btn btn-lg btn-primary">
                        <i className="bi bi-github"> </i>
                        Download Project From GitHub
                    </button>
                </a>
            </div>
        </div>
    </>);
}
export default Donate;