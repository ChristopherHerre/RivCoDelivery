const Skills = () => {
    const skillCategories = [
      {
        title: 'Frontend',
        skills: ['JavaScript (ES6+)', 'React.js', 'Bootstrap 5', 'Responsive Design', 'State Management'],
      },
      {
        title: 'Backend',
        skills: ['Node.js/Express', 'RESTful API Development', 'MySQL & Database Design', 'Authentication & Session Management'],
      },
      {
        title: 'Cloud & APIs',
        skills: ['Google OAuth Integration', 'Google Maps/Places API', 'API Security', 'Distance Calculations'],
      },
      {
        title: 'Tools & Workflow',
        skills: ['Git/GitHub', 'Agile Development', 'Full-Stack Debugging', 'Cross-Browser Testing'],
      },
    ];
  
    return (
        <div className="row">
        <div className="col-12 mb-3">
          <h5 className="border-bottom pb-1 mb-1">Skills</h5>
          <div className="row">
            {skillCategories.map((category) => (
              <div key={category.title} className="col-md-6 mb-2">
                <p className="small mb-1 lh-sm">
                    <b>{category.title}: </b>
                    {category.skills.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  function Resume() {
  return (
    <>
        <div
            className="container"
            style={{
                maxWidth: "8.5in",
                padding: "1in",
                margin: "1rem auto",
                backgroundColor: "#fff",
                boxShadow: "0 0 10px rgba(0,0,0,0.15)",
                fontFamily: "'Times New Roman', Times, serif",
                boxSizing: "border-box"
            }}
        >
            
            {/* Header */}
            <div className="row mb-2">
                <div className="col text-center">
                <h1 className="fs-2 mb-0"><b>Christopher Kenneth Herre</b></h1>
                <p className="lead text-secondary mb-0 fs-6">Full-Stack JavaScript Developer</p>
                <p className="small mb-0">
                    Riverside, California |{" "}
                    <a href="mailto:rivcodelivery@gmail.com" className="text-black text-decoration-none">
                        rivcodelivery@gmail.com
                    </a>
                    {" "}|{" "}
                    <a href="https://www.rivcodelivery.com" className="text-black text-decoration-none">
                        www.rivcodelivery.com
                    </a>
                </p>
                </div>
            </div>

            {/* Professional Summary */}
            <div className="row">
                <div className="col-12">
                <h5 className="border-bottom pb-1 mb-1">Professional Summary</h5>
                <p className="small mb-0 lh-sm">
                    Full-Stack JavaScript Developer with hands-on experience in food delivery logistics and healthcare technology. Proven ability to translate real-world industry experience into technical solutions, demonstrated through the development of RivCoDelivery - a comprehensive food delivery platform. Strong background in React, Node.js, and database design, complemented by practical experience in customer service and enterprise technology implementations.
                </p>
                </div>
                
                {/* Objective */}
                <div className="col-12">
                <h5 className="border-bottom pb-1 mb-1">Objective</h5>
                <p className="small mb-0 lh-sm">
                    Seeking a full-time Full-Stack JavaScript Developer position where I can leverage my unique combination of technical skills and industry experience in food delivery and healthcare technology to build innovative, user-focused web applications. Particularly interested in opportunities that allow me to apply my expertise in React, Node.js, and database design to solve real-world business challenges.
                </p>
                </div>
            </div>

            {/* Projects */}
            <div className="row">
                <div className="col">
                    <h5 className="border-bottom pb-1 mb-1">Projects</h5>
                    <div className="mb-0">
                        <b className="small">www.RivCoDelivery.com</b>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">Lead Developer & Project Manager</small>
                        <small className="text-muted">November 2023 - April 2025</small>
                    </div>
                    <ul className="small mb-0">
                        <li className="mb-0 lh-sm">
                        Conducted business requirements analysis and led the design of a scalable full‑stack food delivery solution—serving customers, drivers, and restaurant admins—built with React, Node.js/Express, and MySQL.
                        </li>
                        <li className="mb-0 lh-sm">
                        Defined and implemented secure access workflows, designing Google OAuth integration and Express middleware for session management and role‑based authorization.
                        </li>
                        <li className="mb-0 lh-sm">
                        Translated delivery network goals into a location‑aware service by integrating Google Maps/Places API and haversine distance calculations to optimize restaurant recommendations and dynamic delivery fees.
                        </li>
                        <li className="mb-0 lh-sm">
                        Designed a flexible, revenue‑driving menu customization feature—complete with ingredient modifiers and real‑time price updates—to meet evolving restaurant business needs.
                        </li>
                        <li className="mb-0 lh-sm">
                        Developed an intuitive restaurant control panel enabling vendors to manage their one‑to‑one restaurant relationship—updating public‑facing information, configuring menu items with ingredients, and customizing available customer ordering options through reactive components for rapid database operations.
                        </li>
                        <li className="mb-0 lh-sm">
                        Architected a normalized MySQL schema with FK relationships for one‑to‑many (users→orders) and junction tables to model true many‑to‑many associations (menu items↔ingredients, orders↔menu items), ensuring data integrity, reducing redundancy, and enabling streamlined reporting.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Education */}
            <div className="row">
                <div className="col-12">
                    <h5 className="border-bottom pb-1 mb-1">Education</h5>
                    <div className="mb-0">
                        <b className="small">California Baptist University</b>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">BS, Computer Information Technology</small>
                        <small className="text-muted">December 2024</small>
                    </div>
                    <small className="text-muted">Relevant Courses:</small>
                    <ul className="small mb-0 d-flex flex-wrap align-items-start list-bullets-horizontal">
                        <li className="mb-0 lh-sm me-4">Database Design and Processing</li>
                        <li className="mb-0 lh-sm me-4">Advanced Business Networking</li>
                        <li className="mb-0 lh-sm me-4">Computer and Network Security</li>
                        <li className="mb-0 lh-sm me-4">Web Application Development</li>
                        <li className="mb-0 lh-sm me-4">E-Commerce Systems Development</li>
                        <li className="mb-0 lh-sm me-4">Legal and Ethical Practices in IT</li>
                        <li className="mb-0 lh-sm me-4">Data Structures</li>
                        <li className="mb-0 lh-sm me-4">Cloud Computing</li>
                        <li className="mb-0 lh-sm me-4">Project Management</li>
                        <li className="mb-0 lh-sm me-4">System Analysis and Design</li>
                        <li className="mb-0 lh-sm me-4">Information Processing Systems</li>
                    </ul>
                    <div className="mb-0">
                        <b className="small">Saddleback College</b>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">AS, Health Information Technology</small>
                        <small className="text-muted">May 2022</small>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">AS, Health Science</small>
                        <small className="text-muted">May 2022</small>
                    </div>
                    <small className="text-muted">Relevant Courses:</small>
                    <ul className="small mb-0 d-flex flex-wrap align-items-start list-bullets-horizontal">
                        <li className="mb-0 lh-sm me-4">Computer Information Systems</li>
                        <li className="mb-0 lh-sm me-4">Alternative Healthcare Delivery Systems</li>
                        <li className="mb-0 lh-sm me-4">Legal and Ethical Aspects of Health Information</li>
                        <li className="mb-0 lh-sm me-4">Human Body Fundamentals</li>
                        <li className="mb-0 lh-sm me-4">Disease Processes</li>
                        <li className="mb-0 lh-sm me-4">Medical Terminology</li>
                        <li className="mb-0 lh-sm me-4">Reimbursement Methodologies</li>
                        <li className="mb-0 lh-sm me-4">ICD Procedure Coding</li>
                        <li className="mb-0 lh-sm me-4">ICD Diagnostic Coding</li>
                        <li className="mb-0 lh-sm me-4">Reporting Healthcare Data</li>
                    </ul>
                </div>
            </div>

            {/* Experience */}
            <div className="row">
                <div className="col-12">
                    <h5 className="border-bottom pb-1 mb-1">Experience</h5>
                    <div className="">
                        <div className="d-flex justify-content-between">
                            <b className="small">Uber Eats</b>
                        </div>
                        <div className="d-flex justify-content-between">
                            <small className="text-muted fst-italic">Delivery Driver</small>
                            <small className="text-muted">October 2019 - September 2024</small>
                        </div>
                        <ul className="small mb-0">
                            <li className="mb-0 lh-sm">
                                Delivered thousands of orders with a 98% customer satisfaction rating, demonstrating exceptional reliability and customer service skills.
                            </li>
                            <li className="mb-0 lh-sm">
                                Gained firsthand experience in food delivery logistics, customer expectations, and restaurant operations, providing valuable insights for developing RivCoDelivery.
                            </li>
                            <li className="mb-0 lh-sm">
                                Managed diverse delivery types including restaurant meals, pharmacy medications, and retail packages, developing expertise in handling different delivery requirements.
                            </li>
                            <li className="mb-0 lh-sm">
                                Optimized delivery routes using navigation apps and local knowledge, contributing to efficient delivery times and positive customer experiences.
                            </li>
                            <li className="mb-0 lh-sm">
                                Maintained consistent communication with customers and restaurants, ensuring smooth order fulfillment and addressing any delivery concerns promptly.
                            </li>
                        </ul>
                    </div>
                    <div className="d-flex justify-content-between">
                        <b className="small">Arrowhead Regional Medical Center</b>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">HIM Department Externship</small>
                        <small className="text-muted">February 2022 - March 2022</small>
                    </div>
                    <ul className="small mb-0">
                        <li className="mb-0 lh-sm">
                            Observed executive-level meetings during Epic EHR implementation, gaining insights into hospital-wide technology migration strategies and decision-making processes.
                        </li>
                        <li className="mb-0 lh-sm">
                            Engaged with HIM supervisors to understand departmental operations including clinical documentation integrity, hospital statistics, and revenue cycle management.
                        </li>
                        <li className="mb-0 lh-sm">
                            Learned about enterprise healthcare technology solutions from vendors including Epic, Nuance Communications, and Hyland Software.
                        </li>
                    </ul>
                    <div className="d-flex justify-content-between">
                        <b className="small">Jimmy Johns</b>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted fst-italic">Delivery Driver & Cashier</small>
                        <small className="text-muted">August 2018 - August 2019</small>
                    </div>
                    <ul className="small mb-0">
                        <li className="mb-0 lh-sm">
                            Managed multiple roles including delivery driver, cashier, and food preparation, demonstrating adaptability and strong work ethic.
                        </li>
                        <li className="mb-0 lh-sm">
                            Collaborated with team members on the make-line to prepare customer orders efficiently while maintaining food safety standards.
                        </li>
                        <li className="mb-0 lh-sm">
                            Performed opening and closing duties including ingredient preparation, store maintenance, and cleaning tasks.
                        </li>
                    </ul>
                </div>
            </div>
            {/* Skills */}
            <Skills />
        </div>
    </>
  );
}

export default Resume;