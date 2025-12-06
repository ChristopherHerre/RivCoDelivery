import React, { useEffect, useState } from 'react';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import axios from 'axios';

function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(""); // Add state for search query
    const [restaurantNames, setRestaurantNames] = useState({}); // Add this state

    useEffect(() => {
        const fetchUsers = async (attempt = 1) => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/users`, {
                    params: { page, limit: 6, query }, // Include query in API request params
                    withCredentials: true
                });
                console.log('Users:', res.data);
                setUsers(res.data);
                
                // Fetch restaurant names for users with restaurant_id
                const restaurantIds = [...new Set(res.data
                    .filter(user => user.restaurant_id)
                    .map(user => user.restaurant_id)
                )];
                
                // Fetch restaurant names
                const restaurantPromises = restaurantIds.map(async (id) => {
                    try {
                        const restaurantRes = await axios.get(`/api/public/restaurants/${id}`);
                        return { id, name: restaurantRes.data.name };
                    } catch (err) {
                        console.error(`Error fetching restaurant ${id}:`, err);
                        return { id, name: 'Unknown' };
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

    function Pages() {
        return (
            <div className="flex items-center justify-center gap-4 my-4">
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPage(prevPage => Math.max(prevPage - 1, 1))}
                    disabled={page === 1}>
                    Previous
                </button>
                <b>Page {page}</b>
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    onClick={() => setPage(prevPage => prevPage + 1)}>
                    Next
                </button>
            </div>
        );
    }
    // Remove unused state variable [value, setValue] if it's not needed elsewhere
    // const [value, setValue] = useState(1); // This seems unused in the provided context

    const handleRestaurantIdChange = async (event, userId) => {
        // ...existing code...
        const newValue = event.target.value;
        setUsers(newUsers => newUsers.map(user => {
            if (user.id === userId) {
                return { ...user, restaurant_id: newValue };
            }
            return user;
        }));
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
                        {user.restaurant_id && restaurantNames[user.restaurant_id] && (
                            <small className="text-gray-400 block mt-1">
                                {restaurantNames[user.restaurant_id]}
                            </small>
                        )}
                    </p>
                    <p className="mb-2">
                        <strong>Created At: </strong>
                        {new Date(user.created_at).toLocaleString()}
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
                    {users?.length > 0 ? <Pages /> : ""}
                    {users?.length > 0 ? (
                        <div className="flex flex-wrap -mx-2">
                            {users?.map(user => (
                                <User user={user} key={user.id} />
                            ))}
                        </div>
                    ) : (
                        <p>No users found.</p>
                    )}
                    {users?.length > 0 ? <Pages /> : ""}
                </>
            )}
        </div>
    );
}

export default Users;