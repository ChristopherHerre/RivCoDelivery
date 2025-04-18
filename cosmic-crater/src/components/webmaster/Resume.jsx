function Resume() {
    return (
      <div
        className="container my-3 p-3"
        style={{
          maxWidth: "1000px",
          backgroundColor: "#fff",
          boxShadow: "0 0 10px rgba(0,0,0,0.15)",
          fontFamily: "'Times New Roman', Times, serif"
        }}
      >
        {/* Header */}
        <div className="row mb-2">
          <div className="col text-center">
            <h1 className="fs-2 fw-bold mb-0">Christopher Kenneth Herre</h1>
            <p className="lead text-secondary mb-0 fs-6">React JavaScript Developer</p>
            <p className="small mb-0">
              Riverside, California |{" "}
              <a href="mailto:rivcodelivery@gmail.com" className="text-decoration-none">
                rivcodelivery@gmail.com
              </a>{" "}
              |{" "}
              <a href="https://www.rivcodelivery.com" className="text-decoration-none">
                www.rivcodelivery.com
              </a>
            </p>
          </div>
        </div>
  
        <hr className="my-2" />
  
        {/* Professional Summary & Objective combined */}
        <div className="row py-1">
          <div className="col-md-6">
            <h5 className="border-bottom pb-1 mb-1">Professional Summary</h5>
            <p className="small mb-1 lh-sm">
              Passionate React JavaScript Developer with solid full-stack development experience creating dynamic, responsive web applications
              using modern JavaScript frameworks, robust back-end integrations, and agile practices.
            </p>
          </div>
          <div className="col-md-6">
            <h5 className="border-bottom pb-1 mb-1">Objective</h5>
            <p className="small mb-1 lh-sm">
              Seeking a full-time React JavaScript Developer position in Riverside, leveraging development skills and project experience
              to build engaging, high-performance applications that drive business success.
            </p>
          </div>
        </div>
  
        <hr className="my-2" />
  
        {/* Projects */}
        <div className="row py-1">
          <div className="col">
            <h5 className="border-bottom pb-1 mb-1">Projects</h5>
            <div className="mb-1"><span className="fw-bold">RivCoDelivery</span></div>
            <ul className="list-unstyled ms-2 small mb-1">
              <li className="mb-0 lh-sm">
                <i className="bi bi-check-circle-fill text-primary me-1"></i>
                Led development of a full-stack order processing system using React and Node.js with Google APIs.
              </li>
              <li className="mb-0 lh-sm">
                <i className="bi bi-check-circle-fill text-primary me-1"></i>
                Implemented pricing calculations with Currency.js for precise subtotal, tax, and delivery fees.
              </li>
              <li className="mb-0 lh-sm">
                <i className="bi bi-check-circle-fill text-primary me-1"></i>
                Built an admin control panel to manage restaurant menus, items and ingredients.
              </li>
              <li className="mb-0 lh-sm">
                <i className="bi bi-check-circle-fill text-primary me-1"></i>
                Designed optimized MySQL schema with many-to-many relationships for better performance.
              </li>
              <li className="mb-0 lh-sm">
                <i className="bi bi-check-circle-fill text-primary me-1"></i>
                Developed RESTful APIs for robust front-end and back-end integration.
              </li>
            </ul>
          </div>
        </div>
  
        <hr className="my-2" />
  
        {/* Education and Experience in two columns */}
        <div className="row py-1">
          <div className="col-md-6">
            <h5 className="border-bottom pb-1 mb-1">Education</h5>
            <div className="mb-1">
              <div className="fw-bold mb-0">California Baptist University</div>
              <div className="d-flex justify-content-between">
                <small className="text-muted fst-italic">BS, Computer Information Technology</small>
                <small className="text-muted">Dec 2024</small>
              </div>
            </div>
            <div>
              <div className="fw-bold mb-0">Saddleback College</div>
              <div className="d-flex justify-content-between">
                <small className="text-muted fst-italic">AS, Health Information Technology</small>
                <small className="text-muted">May 2022</small>
              </div>
              <div className="d-flex justify-content-between">
                <small className="text-muted fst-italic">AS, Health Science</small>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <h5 className="border-bottom pb-1 mb-1">Experience</h5>
            <div className="mb-1">
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Uber Eats</span>
                <small className="text-muted">Oct 2019 - Sep 2024</small>
              </div>
              <small className="text-muted fst-italic d-block">Delivery Driver</small>
              <p className="small mb-0 lh-sm">
                High customer satisfaction with excellent time management and effective communication.
              </p>
            </div>
            <div className="mb-1">
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Arrowhead Regional Medical Center</span>
                <small className="text-muted">Feb 2022 - Mar 2022</small>
              </div>
              <small className="text-muted fst-italic d-block">HIM Department Externship</small>
              <p className="small mb-0 lh-sm">
                50-hour externship during Epic EHR go-live with hospital IT teams.
              </p>
            </div>
            <div>
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Jimmy Johns</span>
                <small className="text-muted">Aug 2018 - Aug 2019</small>
              </div>
              <small className="text-muted fst-italic d-block">Cashier</small>
            </div>
          </div>
        </div>
  
        <hr className="my-2" />
  
        {/* Skills */}
        <div className="row py-1">
          <div className="col">
            <h5 className="border-bottom pb-1 mb-1">Skills</h5>
            <div className="row">
              <div className="col-md-4">
                <ul className="list-unstyled small mb-0">
                  <li>JavaScript (ES6+)</li>
                  <li>React.js</li>
                  <li>Node.js</li>
                </ul>
              </div>
              <div className="col-md-4">
                <ul className="list-unstyled small mb-0">
                  <li>RESTful API Development</li>
                  <li>MySQL & Database Design</li>
                  <li>Google APIs Integration</li>
                </ul>
              </div>
              <div className="col-md-4">
                <ul className="list-unstyled small mb-0">
                  <li>Google Cloud Platform</li>
                  <li>Git/GitHub</li>
                  <li>Agile Development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default Resume;