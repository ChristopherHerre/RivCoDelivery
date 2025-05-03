import React from 'react';

const sections = [
  {
    title: "Introduction",
    subsections: [
      {
        title: "Purpose",
        content: "This document specifies the functional requirements for the Full-Stack Delivery Application. It describes the system's capabilities, interactions, and constraints to guide development of the React frontend components communicating with the Node.js backend."
      },
      {
        title: "Scope",
        content: "The application enables users to discover restaurants, customize menu items, place orders, and manage their profiles. Administrators can manage restaurants, menu items, ingredients, sponsors, and user roles."
      }
    ]
  },
  {
    title: "Overall Description",
    subsections: [
      {
        title: "Product Perspective",
        content: "The frontend is built with React and interacts with a Node.js/Express API. All data persists in a MySQL database. Security is enforced via Google OAuth, sessions, and role-based access control."
      },
      {
        title: "User Characteristics",
        list: [
          "End Users: Browse restaurants, customize orders, and track past orders.",
          "Restaurant Owners: Manage restaurant profile, menu items, and ingredients.",
          "Administrators: Oversee all restaurants, users, sponsors, and order processing."
        ]
      },
      {
        title: "Assumptions and Dependencies",
        list: [
          "Google OAuth credentials and Maps API key are configured via environment variables.",
          "HTTPS is enabled in production for secure data transfer.",
          "Database schema matches the tables referenced by backend routes."
        ]
      }
    ]
  },
  {
    title: "Specific Requirements",
    subsections: [
      {
        title: "Functional Requirements",
        requirements: [
          {
            title: "User Authentication (High)",
            desc: <>Allow users to sign in via Google OAuth 2.0. Frontend must redirect to <code>/api/auth/google</code> and handle callback at <code>/api/auth/google/callback</code>.</>
          },
          {
            title: "Session Management (High)",
            desc: <>Persist user session with cookies. Frontend fetches session at <code>GET /api/session</code> to determine authentication state.</>
          },
          {
            title: "Role-Based Access Control (High)",
            desc: <>Frontend must restrict UI elements based on user role (0: User, 1: Manager, 2: Admin). Use <code>/api/users/:id/role</code> and <code>/api/users/:id/restaurant</code> to manage roles.</>
          },
          {
            title: "User Profile Retrieval (Medium)",
            desc: <>Retrieve authenticated user details via <code>GET /api/profile</code> and <code>GET /api/user/details</code> for display in the profile page.</>
          },
          {
            title: "Manage User Address (Medium)",
            desc: <>Allow users to get, add, update, and clear address via <code>GET/POST/PUT /api/user/address</code> endpoints.</>
          },
          {
            title: "Add & Update Restaurant (High)",
            desc: <>Restaurant owners can create or modify their restaurant using <code>POST /api/addRestaurant</code> and <code>POST /api/manageRestaurant</code>.</>
          },
          {
            title: "Retrieve Restaurants by Location (Medium)",
            desc: <>Users can search for nearby restaurants via <code>GET /api/restaurants/:latitude/:longitude</code>, displaying sorted by distance.</>
          },
          {
            title: "Get Restaurant Menu (Medium)",
            desc: <>Fetch menu for a restaurant using <code>GET /api/restaurants2/:restaurantId/menu</code> or <code>GET /api/menu/item</code>.</>
          },
          {
            title: "CRUD Menu Items (High)",
            desc: <>Admins can add (<code>POST /api/add-menu-item</code>), update (<code>POST /api/update-menu-item/:id</code>), delete (<code>DELETE /api/menu-items/:id</code>), and list (<code>GET /api/menu-items-list</code>) menu items.</>
          },
          {
            title: "CRUD Ingredients (High)",
            desc: <>Admins can add (<code>POST /api/menu-item-ingredients</code>), update (<code>PUT /api/menu-ingredients/:id</code>), delete (<code>DELETE /api/menu-item-ingredients/:ingredient_id</code>), and list (<code>GET /api/menu-ingredients/:menuItem</code>) ingredients.</>
          },
          {
            title: "Map Ingredients to Menu Items (Medium)",
            desc: <>Allow adding and listing ingredient mappings via <code>POST /api/menu-items</code> and <code>GET /api/menu-items</code>.</>
          },
          {
            title: "Search Menu Items (Medium)",
            desc: <>Implement menu item search by name using <code>GET /api/menu/item/search?menuItemName=...</code>.</>
          },
          {
            title: "Retrieve Sponsors List (Low)",
            desc: <>Display sponsors via <code>GET /api/sponsors</code> endpoint.</>
          },
          {
            title: "Health Check (Low)",
            desc: <>Frontend can poll <code>GET /api/health</code> to monitor backend availability.</>
          },
          {
            title: "Retrieve Maps API Key (Low)",
            desc: <>Fetch Google Maps API key via <code>GET /api/maps-api-key</code> for map integrations.</>
          },
          {
            title: "Manage Cart (Medium)",
            desc: <>Save user cart items with <code>POST /api/cart</code> before order placement.</>
          },
          {
            title: "Place Order (High)",
            desc: <>Submit orders using <code>POST /api/co</code> with user input and cart data, enforcing rate limit (<code>express-rate-limit</code>).</>
          },
          {
            title: "Retrieve Orders (Medium)",
            desc: <>Admins retrieve open orders via <code>GET /api/orders</code>; users view their orders via <code>GET /api/user/orders</code>.</>
          },
          {
            title: "Update Order Status (Medium)",
            desc: <>Mark orders as open with <code>POST /api/changeOrderOpen</code>.</>
          },
          {
            title: "Retrieve Order Items (Medium)",
            desc: <>Fetch order line items via <code>GET /api/order_items?oid=...</code>.</>
          }
        ]
      }
    ]
  }
];

const SRS = () => (
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
    <div className="row mb-2">
      <div className="col text-center">
        <h1 className="fs-2 mb-0"><b>Software Requirements Specification</b></h1>
        <p className="lead text-secondary mb-0 fs-6">Full-Stack Delivery Application</p>
      </div>
    </div>
    {sections.map((section, i) => (
      <div className="row" key={section.title}>
        <div className="col-12">
          <h2 className="border-bottom pb-1 mb-1">{i + 1}. {section.title}</h2>
          {section.subsections && section.subsections.map((sub, j) => (
            <div key={sub.title}>
              <h3 className="mb-1">{i + 1}.{j + 1} {sub.title}</h3>
              {sub.content && <p className="small mb-2 lh-sm">{sub.content}</p>}
              {sub.list && (
                <ul className="small mb-2 lh-sm">
                  {sub.list.map((item, k) => (
                    <li key={k}>{i + 1}.{j + 1}.{k + 1} {item}</li>
                  ))}
                </ul>
              )}
              {sub.requirements && (
                <ol className="small mb-2 lh-sm">
                  {sub.requirements.map((req, k) => (
                    <li key={k}>
                      <strong>{i + 1}.{j + 1}.{k + 1} {req.title}</strong>
                      <div>{req.desc}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default SRS;