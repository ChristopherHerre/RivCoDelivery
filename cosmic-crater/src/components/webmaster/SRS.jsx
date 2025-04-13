import React from 'react';

const SRS = () => (
  <div id="wr" className="requirements-spec p-6 max-w-4xl mx-auto">
    <h1>Software Requirements Specification</h1>

    {/* Introduction */}
    <section>
      <h2>Introduction</h2>
      <h3>Purpose</h3>
      <p>
        This document specifies the functional requirements for the Full-Stack Delivery Application. It describes the system's capabilities, interactions, and constraints to guide development of the React frontend components communicating with the Node.js backend.
      </p>
      <h3>Scope</h3>
      <p>
        The application enables users to discover restaurants, customize menu items, place orders, and manage their profiles. Administrators can manage restaurants, menu items, ingredients, sponsors, and user roles.
      </p>
    </section>

    {/* Overall Description */}
    <section>
      <h2>Overall Description</h2>
      <h3>Product Perspective</h3>
      <p>
        The frontend is built with React and interacts with a Node.js/Express API. All data persists in a MySQL database. Security is enforced via Google OAuth, sessions, and role-based access control.
      </p>
      <h3>User Characteristics</h3>
      <ul>
        <li>End Users: Browse restaurants, customize orders, and track past orders.</li>
        <li>Restaurant Owners: Manage restaurant profile, menu items, and ingredients.</li>
        <li>Administrators: Oversee all restaurants, users, sponsors, and order processing.</li>
      </ul>
      <h3>Assumptions and Dependencies</h3>
      <ul>
        <li>Google OAuth credentials and Maps API key are configured via environment variables.</li>
        <li>HTTPS is enabled in production for secure data transfer.</li>
        <li>Database schema matches the tables referenced by backend routes.</li>
      </ul>
    </section>

    {/* Specific Requirements */}
    <section>
      <h2>Specific Requirements</h2>
      <h3>Functional Requirements</h3>
      <ol>
        <li>
          <strong>User Authentication (High)</strong>
          <p>Allow users to sign in via Google OAuth 2.0. Frontend must redirect to <code>/api/auth/google</code> and handle callback at <code>/api/auth/google/callback</code>.</p>
        </li>
        <li>
          <strong>Session Management (High)</strong>
          <p>Persist user session with cookies. Frontend fetches session at <code>GET /api/session</code> to determine authentication state.</p>
        </li>
        <li>
          <strong>Role-Based Access Control (High)</strong>
          <p>Frontend must restrict UI elements based on user role (0: User, 1: Manager, 2: Admin). Use <code>/api/users/:id/role</code> and <code>/api/users/:id/restaurant</code> to manage roles.</p>
        </li>
        <li>
          <strong>User Profile Retrieval (Medium)</strong>
          <p>Retrieve authenticated user details via <code>GET /api/profile</code> and <code>GET /api/user/details</code> for display in the profile page.</p>
        </li>
        <li>
          <strong>Manage User Address (Medium)</strong>
          <p>Allow users to get, add, update, and clear address via <code>GET/POST/PUT /api/user/address</code> endpoints.</p>
        </li>
        <li>
          <strong>Add & Update Restaurant (High)</strong>
          <p>Restaurant owners can create or modify their restaurant using <code>POST /api/addRestaurant</code> and <code>POST /api/manageRestaurant</code>.</p>
        </li>
        <li>
          <strong>Retrieve Restaurants by Location (Medium)</strong>
          <p>Users can search for nearby restaurants via <code>GET /api/restaurants/:latitude/:longitude</code>, displaying sorted by distance.</p>
        </li>
        <li>
          <strong>Get Restaurant Menu (Medium)</strong>
          <p>Fetch menu for a restaurant using <code>GET /api/restaurants2/:restaurantId/menu</code> or <code>GET /api/menu/item</code>.</p>
        </li>
        <li>
          <strong>CRUD Menu Items (High)</strong>
          <p>Admins can add (<code>POST /api/add-menu-item</code>), update (<code>POST /api/update-menu-item/:id</code>), delete (<code>DELETE /api/menu-items/:id</code>), and list (<code>GET /api/menu-items-list</code>) menu items.</p>
        </li>
        <li>
          <strong>CRUD Ingredients (High)</strong>
          <p>Admins can add (<code>POST /api/menu-item-ingredients</code>), update (<code>PUT /api/menu-ingredients/:id</code>), delete (<code>DELETE /api/menu-item-ingredients/:ingredient_id</code>), and list (<code>GET /api/menu-ingredients/:menuItem</code>) ingredients.</p>
        </li>
        <li>
          <strong>Map Ingredients to Menu Items (Medium)</strong>
          <p>Allow adding and listing ingredient mappings via <code>POST /api/menu-items</code> and <code>GET /api/menu-items</code>.</p>
        </li>
        <li>
          <strong>Search Menu Items (Medium)</strong>
          <p>Implement menu item search by name using <code>GET /api/menu/item/search?menuItemName=...</code>.</p>
        </li>
        <li>
          <strong>Retrieve Sponsors List (Low)</strong>
          <p>Display sponsors via <code>GET /api/sponsors</code> endpoint.</p>
        </li>
        <li>
          <strong>Health Check (Low)</strong>
          <p>Frontend can poll <code>GET /api/health</code> to monitor backend availability.</p>
        </li>
        <li>
          <strong>Retrieve Maps API Key (Low)</strong>
          <p>Fetch Google Maps API key via <code>GET /api/maps-api-key</code> for map integrations.</p>
        </li>
        <li>
          <strong>Manage Cart (Medium)</strong>
          <p>Save user cart items with <code>POST /api/cart</code> before order placement.</p>
        </li>
        <li>
          <strong>Place Order (High)</strong>
          <p>Submit orders using <code>POST /api/co</code> with user input and cart data, enforcing rate limit (<code>express-rate-limit</code>).</p>
        </li>
        <li>
          <strong>Retrieve Orders (Medium)</strong>
          <p>Admins retrieve open orders via <code>GET /api/orders</code>; users view their orders via <code>GET /api/user/orders</code>.</p>
        </li>
        <li>
          <strong>Update Order Status (Medium)</strong>
          <p>Mark orders as open with <code>POST /api/changeOrderOpen</code>.</p>
        </li>
        <li>
          <strong>Retrieve Order Items (Medium)</strong>
          <p>Fetch order line items via <code>GET /api/order_items?oid=...</code>.</p>
        </li>
      </ol>
    </section>
  </div>
);

export default SRS;
