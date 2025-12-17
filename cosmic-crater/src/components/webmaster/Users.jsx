import React, { useEffect, useState } from 'react';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import Button from '../common/Button';
import Pagination from '../common/Pagination';
import axios from 'axios';

function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(""); // Add state for search query
    const [restaurantNames, setRestaurantNames] = useState({}); // Add this state
    const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, totalPages: 1 });

    useEffect(() => {
        const fetchUsers = async (attempt = 1) => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/users`, {
                    params: { page, limit: 6, query }, // Include query in API request params
                    withCredentials: true
                });
                console.log('Users response:', res.data);
                console.log('Response type:', Array.isArray(res.data) ? 'array' : 'object');
                console.log('Response keys:', Array.isArray(res.data) ? 'N/A' : Object.keys(res.data));
                
                // Handle both old format (array) and new format (object with users and pagination)
                let usersData;
                let paginationData;
                
                if (Array.isArray(res.data)) {
                    // Old format - just an array of users
                    usersData = res.data;
                    paginationData = { 
                        page, 
                        limit: 6, 
                        total: usersData.length, 
                        totalPages: Math.ceil(usersData.length / 6) || 1 
                    };
                } else {
                    // New format - object with users and pagination
                    usersData = res.data.users || [];
                    paginationData = res.data.pagination || { 
                        page, 
                        limit: 6, 
                        total: usersData.length, 
                        totalPages: Math.ceil(usersData.length / 6) || 1 
                    };
                }
                
                console.log('Parsed usersData:', usersData.length, 'users');
                console.log('Parsed paginationData:', paginationData);
                
                // Ensure pagination has valid values
                if (!paginationData.totalPages || paginationData.totalPages === 0) {
                    const calculatedTotal = paginationData.total || usersData.length;
                    const calculatedLimit = paginationData.limit || 6;
                    paginationData.totalPages = Math.max(1, Math.ceil(calculatedTotal / calculatedLimit));
                    console.log('Recalculated totalPages:', paginationData.totalPages, 'from total:', calculatedTotal, 'limit:', calculatedLimit);
                }
                
                // Ensure total is set
                if (!paginationData.total && usersData.length > 0) {
                    paginationData.total = usersData.length;
                }
                
                console.log('Final pagination data being set:', paginationData);
                
                setUsers(usersData);
                setPagination(paginationData);
                
                // Fetch restaurant names for users with restaurant_id
                const restaurantIds = [...new Set(usersData
                    .filter(user => user.restaurant_id)
                    .map(user => Number(user.restaurant_id)) // Ensure it's a number
                )];
                
                // Fetch restaurant names
                const restaurantPromises = restaurantIds.map(async (id) => {
                    try {
                        const restaurantRes = await axios.get(`/api/public/restaurants/${id}`);
                        return { id: Number(id), name: restaurantRes.data.name };
                    } catch (err) {
                        console.error(`Error fetching restaurant ${id}:`, err);
                        return { id: Number(id), name: 'Unknown' };
                    }
                });
                
                const restaurants = await Promise.all(restaurantPromises);
                const namesMap = restaurants.reduce((acc, r) => {
                    acc[r.id] = r.name;
                    return acc;
                }, {});
                setRestaurantNames(namesMap);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchUsers(attempt + 1);
                } else {
                    console.error('Error fetching users:', err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page, query]); // Add query to dependency array


    const handleClearCart = async (userId) => {
        if (!window.confirm(`Are you sure you want to clear the cart for user ${userId}?`)) {
            return;
        }
        
        try {
            const response = await axios.delete(`/api/users/${userId}/cart`, {
                withCredentials: true
            });
            console.log('Cart cleared:', response.data);
            alert(`Cart cleared successfully. Removed ${response.data.removed || 0} items.`);
        } catch (err) {
            console.error('Error clearing cart:', err);
            alert(`Error clearing cart: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleRestaurantIdChange = async (event, userId) => {
        const inputValue = event.target.value.trim();
        const newValue = inputValue === '' ? null : (inputValue ? Number(inputValue) : null);
        
        // Validate the restaurant ID
        if (newValue !== null && (isNaN(newValue) || newValue <= 0)) {
            console.error('Invalid restaurant ID:', inputValue);
            return;
        }
        
        // Get the old restaurant_id before updating
        const oldUser = users.find(u => u.id === userId);
        const oldRestaurantId = oldUser?.restaurant_id;
        
        // Update the user's restaurant_id in state
        setUsers(newUsers => newUsers.map(user => {
            if (user.id === userId) {
                return { ...user, restaurant_id: newValue };
            }
            return user;
        }));
        
        // Fetch the new restaurant name if a restaurant ID was provided
        if (newValue !== null && newValue > 0) {
            try {
                const restaurantRes = await axios.get(`/api/public/restaurants/${newValue}`);
                console.log('Restaurant response:', restaurantRes.data);
                if (restaurantRes.data && restaurantRes.data.name) {
                    setRestaurantNames(prevNames => ({
                        ...prevNames,
                        [newValue]: restaurantRes.data.name
                    }));
                } else {
                    console.error(`Restaurant ${newValue} response missing name:`, restaurantRes.data);
                    setRestaurantNames(prevNames => ({
                        ...prevNames,
                        [newValue]: 'Restaurant not found'
                    }));
                }
            } catch (err) {
                console.error(`Error fetching restaurant ${newValue}:`, err.response || err);
                // Show error message based on the error type
                if (err.response && err.response.status === 404) {
                    setRestaurantNames(prevNames => ({
                        ...prevNames,
                        [newValue]: 'Restaurant not found'
                    }));
                } else {
                    setRestaurantNames(prevNames => ({
                        ...prevNames,
                        [newValue]: 'Error loading restaurant'
                    }));
                }
            }
        } else if (newValue === null) {
            // Clear the restaurant name if restaurant_id is cleared
            if (oldRestaurantId) {
                setRestaurantNames(prevNames => {
                    const updated = { ...prevNames };
                    delete updated[oldRestaurantId];
                    return updated;
                });
            }
        }
        
        // Update on the backend
        try {
            const response = await axios.put(`/api/users/${userId}/restaurant`, { restaurant_id: newValue }, {
                withCredentials: true
            });
            console.log('Restaurant ID updated:', response.data);
        } catch (err) {
            console.error('Error updating restaurant ID:', err);
        }
    };

    // Add handler for search input changes
    const handleSearchChange = (event) => {
        setQuery(event.target.value);
        setPage(1); // Reset to page 1 when search query changes
    };

    function User({ user }) {
        const [loading, setLoading] = useState(false);
        const handleChange = async (event, userId) => {
            // ...existing code...
            const newValue = event.target.value;
            // setValue(newValue); // Remove if 'value' state is removed
            setUsers(newUsers => newUsers.map(user => {
                if (user.id === userId) {
                    return { ...user, role: newValue };
                }
                return user;
            }));
            setLoading(true);
            try {
                const response = await axios.put(`/api/users/${userId}/role`, { role: newValue }, {
                    withCredentials: true
                }).then(() => {
                    setLoading(false);
                });
                console.log('Role updated:', response.data);
            } catch (err) {
                console.error('Error updating role:', err);
            }
        };

        return loading ? (<Spinner />) : (
            <div key={user.id} className="w-full md:w-1/2 lg:w-1/3 px-2 mb-3">
                <div className="border border-gray-300 rounded-lg p-3 shadow-sm bg-gray-900 text-white h-full">
                    <h5 className="text-lg font-semibold mb-2 text-white">{user.name}</h5>
                    <p className="mb-2">
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p className="mb-2">
                        <strong>Address: </strong>
                        <span>{user.address_street_number} </span>
                        <span>{user.address_street}, </span>
                        <span>{user.address_city}, </span>
                        <span>{user.address_state} </span>
                        <span>{user.address_zip}</span>
                    </p>
                    <p className="mb-2">
                        <strong>Latitude: </strong>
                        {user.address_latitude}
                    </p>
                    <p className="mb-2">
                        <strong>Longitude: </strong>
                        {user.address_longitude}
                    </p>
                    <p className="mb-2">
                        <strong>Role: </strong>
                        <form>
                            <div className="mb-2">
                                <input
                                    type="range"
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    id="roleRange"
                                    min="0"
                                    max="2"
                                    step="1"
                                    defaultValue={user.role}
                                    onChange={(e) => handleChange(e, user.id)}
                                />
                                <div className="flex justify-between text-sm mt-1">
                                    <span>Basic</span>
                                    <span>Driver</span>
                                    <span>Restaurant</span>
                                </div>
                                <small className="text-white text-sm">
                                    Current role: <strong>{user.role}</strong>
                                </small>
                            </div>
                        </form>
                    </p>
                    <p className="mb-2">
                        <strong>Restaurant ID: </strong>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            defaultValue={user.restaurant_id}
                            onChange={(e) => handleRestaurantIdChange(e, user.id)}
                        />
                        {user.restaurant_id && (
                            <small className="text-gray-400 block mt-1">
                                {restaurantNames[Number(user.restaurant_id)] || 'Loading...'}
                            </small>
                        )}
                    </p>
                    <p className="mb-2">
                        <strong>Created At: </strong>
                        {new Date(user.created_at).toLocaleString()}
                    </p>
                    <p className="mb-2">
                        <Button
                            variant="danger"
                            onClick={() => handleClearCart(user.id)}
                            size="sm"
                            fullWidth
                        >
                            Clear Cart
                        </Button>
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="m-1">
            <h1>Users List</h1>
            {/* Add Search Input Field */}
            <div className="flex flex-wrap mb-3">
                <div className="w-full md:w-1/2">
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search users by name or email..."
                        value={query}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <Pagination
                        currentPage={page}
                        onPageChange={setPage}
                        totalPages={pagination?.totalPages ?? 1}
                        total={pagination?.total ?? 0}
                        itemName="users"
                        loading={loading}
                    />
                    {users?.length > 0 ? (
                        <div className="flex flex-wrap -mx-2">
                            {users?.map(user => (
                                <User user={user} key={user.id} />
                            ))}
                        </div>
                    ) : (
                        <p>No users found.</p>
                    )}
                    <Pagination
                        currentPage={page}
                        onPageChange={setPage}
                        totalPages={pagination?.totalPages ?? 1}
                        total={pagination?.total ?? 0}
                        itemName="users"
                        loading={loading}
                    />
                </>
            )}
        </div>
    );
}

export default Users;