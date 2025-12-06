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
        <div className="flex flex-wrap">
        <div className="w-full mb-3">
          <h5 className="border-b pb-1 mb-1">Skills</h5>
          <div className="flex flex-wrap">
            {skillCategories.map((category) => (
              <div key={category.title} className="w-full md:w-1/2 mb-2">
                <p className="text-sm mb-1 leading-tight">
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
            <div className="flex flex-wrap mb-2">
                <div className="w-full text-center">
                <h1 className="text-2xl mb-0"><b>Christopher Kenneth Herre</b></h1>
                <p className="text-lg text-gray-600 mb-0 text-base">Full-Stack JavaScript Developer</p>
                <p className="text-sm mb-0">
                    Riverside, California |{" "}
                    <a href="mailto:rivcodelivery@gmail.com" className="text-black no-underline">
                        rivcodelivery@gmail.com
                    </a>
                    {" "}|{" "}
                    <a href="https://www.rivcodelivery.com" className="text-black no-underline">
                        www.rivcodelivery.com
                    </a>
                </p>
                </div>
            </div>

            {/* Professional Summary */}
            <div className="flex flex-wrap">
                <div className="w-full">
                <h5 className="border-b pb-1 mb-1">Professional Summary</h5>
                <p className="text-sm mb-0 leading-tight">
                    Full-Stack JavaScript Developer with hands-on experience in food delivery logistics and healthcare technology. Proven ability to translate real-world industry experience into technical solutions, demonstrated through the development of RivCoDelivery - a comprehensive food delivery platform. Strong background in React, Node.js, and database design, complemented by practical experience in customer service and enterprise technology implementations.
                </p>
                </div>
                
                {/* Objective */}
                <div className="w-full">
                <h5 className="border-b pb-1 mb-1">Objective</h5>
                <p className="text-sm mb-0 leading-tight">
                    Seeking a full-time JavaScript Developer position where I can leverage my unique combination of technical skills and industry experience in food delivery and healthcare technology to build innovative, user-focused web applications. Particularly interested in opportunities that allow me to apply my expertise in React, Node.js, and database design to solve real-world business challenges.
                </p>
                </div>
            </div>

            {/* Projects */}
            <div className="flex flex-wrap">
                <div className="w-full">
                    <h5 className="border-b pb-1 mb-1">Projects</h5>
                    <div className="mb-0">
                        <b className="text-sm">www.RivCoDelivery.com</b>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">Lead Developer & Project Manager</small>
                        <small className="text-gray-500">November 2023 - April 2025</small>
                    </div>
                    <ul className="text-sm mb-0">
                        <li className="mb-0 leading-tight">
                        Conducted business requirements analysis and led the design of a scalable full‑stack food delivery solution—serving customers, drivers, and restaurant admins—built with React, Node.js/Express, and MySQL.
                        </li>
                        <li className="mb-0 leading-tight">
                        Defined and implemented secure access workflows, designing Google OAuth integration and Express middleware for session management and role‑based authorization.
                        </li>
                        <li className="mb-0 leading-tight">
                        Translated delivery network goals into a location‑aware service by integrating Google Maps/Places API to optimize restaurant recommendations and dynamic delivery fees.
                        </li>
                        <li className="mb-0 leading-tight">
                        Designed a flexible, revenue‑driving menu customization feature—complete with ingredient modifiers and real‑time price updates—to meet evolving restaurant business needs.
                        </li>
                        <li className="mb-0 leading-tight">
                        Developed an intuitive restaurant control panel enabling vendors to manage their one‑to‑one restaurant relationship—updating public‑facing information, configuring menu items with ingredients, and customizing available customer ordering options through reactive components for rapid database operations.
                        </li>
                        <li className="mb-0 leading-tight">
                        Architected a normalized MySQL schema with FK relationships for one‑to‑many (users→orders) and junction tables to model true many‑to‑many associations (menu items↔ingredients, orders↔menu items), ensuring data integrity, reducing redundancy, and enabling streamlined reporting.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Education */}
            <div className="flex flex-wrap">
                <div className="w-full">
                    <h5 className="border-b pb-1 mb-1">Education</h5>
                    <div className="mb-0">
                        <b className="text-sm">California Baptist University</b>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">BS, Computer Information Technology</small>
                        <small className="text-gray-500">December 2024</small>
                    </div>
                    <small className="text-gray-500">Relevant Courses:</small>
                    <ul className="text-sm mb-0 flex flex-wrap items-start list-bullets-horizontal">
                        <li className="mb-0 leading-tight mr-4">Database Design and Processing</li>
                        <li className="mb-0 leading-tight mr-4">Advanced Business Networking</li>
                        <li className="mb-0 leading-tight mr-4">Computer and Network Security</li>
                        <li className="mb-0 leading-tight mr-4">Web Application Development</li>
                        <li className="mb-0 leading-tight mr-4">E-Commerce Systems Development</li>
                        <li className="mb-0 leading-tight mr-4">Legal and Ethical Practices in IT</li>
                        <li className="mb-0 leading-tight mr-4">Data Structures</li>
                        <li className="mb-0 leading-tight mr-4">Cloud Computing</li>
                        <li className="mb-0 leading-tight mr-4">Project Management</li>
                        <li className="mb-0 leading-tight mr-4">System Analysis and Design</li>
                        <li className="mb-0 leading-tight mr-4">Information Processing Systems</li>
                    </ul>
                    <div className="mb-0">
                        <b className="text-sm">Saddleback College</b>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">AS, Health Information Technology</small>
                        <small className="text-gray-500">May 2022</small>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">AS, Health Science</small>
                        <small className="text-gray-500">May 2022</small>
                    </div>
                    <small className="text-gray-500">Relevant Courses:</small>
                    <ul className="text-sm mb-0 flex flex-wrap items-start list-bullets-horizontal">
                        <li className="mb-0 leading-tight mr-4">Computer Information Systems</li>
                        <li className="mb-0 leading-tight mr-4">Alternative Healthcare Delivery Systems</li>
                        <li className="mb-0 leading-tight mr-4">Legal and Ethical Aspects of Health Information</li>
                        <li className="mb-0 leading-tight mr-4">Human Body Fundamentals</li>
                        <li className="mb-0 leading-tight mr-4">Disease Processes</li>
                        <li className="mb-0 leading-tight mr-4">Medical Terminology</li>
                        <li className="mb-0 leading-tight mr-4">Reimbursement Methodologies</li>
                        <li className="mb-0 leading-tight mr-4">ICD Procedure Coding</li>
                        <li className="mb-0 leading-tight mr-4">ICD Diagnostic Coding</li>
                        <li className="mb-0 leading-tight mr-4">Reporting Healthcare Data</li>
                    </ul>
                </div>
            </div>

            {/* Experience */}
            <div className="flex flex-wrap">
                <div className="w-full">
                    <h5 className="border-b pb-1 mb-1">Experience</h5>
                    <div className="">
                        <div className="flex justify-between">
                            <b className="text-sm">7-11</b>
                        </div>
                        <div className="flex justify-between">
                            <small className="text-gray-500 italic">Store Associate</small>
                            <small className="text-gray-500">May 2025 - Present</small>
                        </div>
                        <ul className="text-sm mb-0">
                            <li className="mb-0 leading-tight">
                                Scanning store merchandise at the register, verifying customer identification for age-restricted items, and processing cash and credit card transactions.
                            </li>
                            <li className="mb-0 leading-tight">
                                Restocking shelves, cleaning store areas, and maintaining a clean and organized shopping environment.
                            </li>
                            <li className="mb-0 leading-tight">
                                Providing excellent customer service to ensure a positive shopping experience.
                            </li>
                            <li className="mb-0 leading-tight">
                                Receiving, verifying, and logging vendor deliveries from McLane, Monster Energy, Coca‑Cola, and other major brands.
                            </li>
                        </ul>
                    </div>
                    <div className="">
                        <div className="flex justify-between">
                            <b className="text-sm">Uber Eats</b>
                        </div>
                        <div className="flex justify-between">
                            <small className="text-gray-500 italic">Delivery Driver</small>
                            <small className="text-gray-500">October 2019 - May 2025</small>
                        </div>
                        <ul className="text-sm mb-0">
                            <li className="mb-0 leading-tight">
                                Delivered thousands of orders with a 98% customer satisfaction rating, demonstrating exceptional reliability and customer service skills.
                            </li>
                            <li className="mb-0 leading-tight">
                                Gained firsthand experience in food delivery logistics, customer expectations, and restaurant operations, providing valuable insights for developing RivCoDelivery.
                            </li>
                            <li className="mb-0 leading-tight">
                                Managed diverse delivery types including restaurant meals, pharmacy medications, and retail packages, developing expertise in handling different delivery requirements.
                            </li>
                            <li className="mb-0 leading-tight">
                                Optimized delivery routes using navigation apps and local knowledge, contributing to efficient delivery times and positive customer experiences.
                            </li>
                            <li className="mb-0 leading-tight">
                                Maintained consistent communication with customers and restaurants, ensuring smooth order fulfillment and addressing any delivery concerns promptly.
                            </li>
                        </ul>
                    </div>
                    <div className="flex justify-between">
                        <b className="text-sm">Arrowhead Regional Medical Center</b>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">HIM Department Externship</small>
                        <small className="text-gray-500">February 2022 - March 2022</small>
                    </div>
                    <ul className="text-sm mb-0">
                        <li className="mb-0 leading-tight">
                            Observed executive-level meetings during Epic EHR implementation, gaining insights into hospital-wide technology migration strategies and decision-making processes.
                        </li>
                        <li className="mb-0 leading-tight">
                            Engaged with HIM supervisors to understand departmental operations including clinical documentation integrity, hospital statistics, and revenue cycle management.
                        </li>
                        <li className="mb-0 leading-tight">
                            Learned about enterprise healthcare technology solutions from vendors including Epic, Nuance Communications, and Hyland Software.
                        </li>
                    </ul>
                    <div className="flex justify-between">
                        <b className="text-sm">Jimmy Johns</b>
                    </div>
                    <div className="flex justify-between">
                        <small className="text-gray-500 italic">Delivery Driver & Cashier</small>
                        <small className="text-gray-500">August 2018 - August 2019</small>
                    </div>
                    <ul className="text-sm mb-0">
                        <li className="mb-0 leading-tight">
                            Managed multiple roles including delivery driver, cashier, and food preparation, demonstrating adaptability and strong work ethic.
                        </li>
                        <li className="mb-0 leading-tight">
                            Collaborated with team members on the make-line to prepare customer orders efficiently while maintaining food safety standards.
                        </li>
                        <li className="mb-0 leading-tight">
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