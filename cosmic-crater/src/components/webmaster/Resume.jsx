function Resume() {
    return (
      <div className="container my-5 px-3" style={{ maxWidth: "800px", fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0">Christopher Kenneth Herre</h1>
          <p className="lead mb-1">React JavaScript Developer</p>
          <small>
            Riverside, California | rivcodelivery@gmail.com |{" "}
            <a href="https://www.rivcodelivery.com" className="text-decoration-none">
              www.rivcodelivery.com
            </a>
          </small>
        </div>
  
        {/* Objective */}
        <section className="mb-4">
          <h5 className="fw-bold border-bottom pb-1">Objective</h5>
          <p>
            To obtain a full-time position as a React JavaScript Developer where I can utilize my skills and experience to create dynamic and responsive web applications.
          </p>
        </section>
  
        {/* Projects */}
        <section className="mb-4">
          <h5 className="fw-bold border-bottom pb-1">Projects</h5>
          <h6 className="fw-semibold mb-1">RivCoDelivery</h6>
          <ul className="ps-3">
            <li>Developed full-stack order processing using React and Node.js, integrating Google APIs.</li>
            <li>Used Currency.js for accurate subtotal, tax, and delivery fee calculations.</li>
            <li>Built an admin control panel for menu and ingredient management.</li>
            <li>Designed normalized MySQL schema with many-to-many relationships and optimized queries.</li>
            <li>Created RESTful APIs for seamless front-end/back-end integration.</li>
            <li>Used agile practices with modern JS tools for scalable development.</li>
          </ul>
        </section>
  
        {/* Education */}
        <section className="mb-4">
          <h5 className="fw-bold border-bottom pb-1">Education</h5>
          <div className="mb-2">
            <h6 className="mb-0 fw-semibold">California Baptist University</h6>
            <small className="text-muted">Graduated December 2024</small>
            <p className="mb-1">Bachelor of Science, Computer Information Technology</p>
          </div>
          <div>
            <h6 className="mb-0 fw-semibold">Saddleback College</h6>
            <small className="text-muted">Graduated May 2022</small>
            <ul className="ps-3 mb-0">
              <li>Associate of Science, Health Information Technology</li>
              <li>Associate of Science, Health Science</li>
            </ul>
          </div>
        </section>
  
        {/* Experience */}
        <section className="mb-4">
          <h5 className="fw-bold border-bottom pb-1">Experience</h5>
  
          <div className="mb-3">
            <h6 className="fw-semibold mb-0">Uber Eats</h6>
            <p className="mb-0"><em>Delivery Driver | October 2019 - September 2024</em></p>
            <p>Delivered thousands of items while maintaining excellent customer ratings and receiving positive reviews.</p>
          </div>
  
          <div className="mb-3">
            <h6 className="fw-semibold mb-0">Arrowhead Regional Medical Center</h6>
            <p className="mb-0"><em>Externship | February 2022 - March 2022</em></p>
            <p>Completed 50-hour externship in the HIM Department during Epic EHR go-live.</p>
            <ul className="ps-3">
              <li>Shadowed the HIM Director and supervisors.</li>
              <li>Observed hospital IT infrastructure and workflows.</li>
              <li>Gained hands-on understanding of EHR deployment.</li>
            </ul>
          </div>
  
          <div>
            <h6 className="fw-semibold mb-0">Jimmy Johns</h6>
            <p className="mb-0"><em>Cashier | August 2018 - August 2019</em></p>
            <p>Handled orders, upsold add-ons, made deliveries, and supported store operations.</p>
          </div>
        </section>
  
        {/* Skills */}
        <section>
          <h5 className="fw-bold border-bottom pb-1">Skills</h5>
          <div className="row">
            <div className="col-6">
              <ul className="ps-3">
                <li>JavaScript</li>
                <li>React JS</li>
                <li>Node.js</li>
                <li>MySQL</li>
                <li>Google APIs</li>
              </ul>
            </div>
            <div className="col-6">
              <ul className="ps-3">
                <li>Google Cloud Platform</li>
                <li>Linux</li>
                <li>GitHub</li>
                <li>Java</li>
                <li>C# ASP.NET MVC</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    );
  }
  
  export default Resume;
  