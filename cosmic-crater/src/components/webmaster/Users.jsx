import React, { useEffect, useState } from 'react';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import axios from 'axios';

function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchUsers = async (attempt = 1) => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/users`, {
                    params: { page, limit: 6 },
                    withCredentials: true
                });
                console.log('Users:', res.data);
                setUsers(res.data);
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
    }, [page, setUsers]);

    function Pages() {
        return (
            <div className="pagination">
                <button 
                    className="btn btn-secondary"
                    onClick={() => setPage(prevPage => Math.max(prevPage - 1, 1))} 
                    disabled={page === 1}>
                    Previous
                </button>
                <b>Page {page}</b>
                <button 
                    className="btn btn-secondary"
                    onClick={() => setPage(prevPage => prevPage + 1)}>
                    Next
                </button>
            </div>
        );
    }
    const [value, setValue] = useState(1);
    
    const handleRestaurantIdChange = async (event, userId) => {
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
    function User({ user }) {
        const [loading, setLoading] = useState(false);
        const handleChange = async (event, userId) => {
            const newValue = event.target.value;
            setValue(newValue);
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
            <div key={user.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card p-3 shadow-sm bg-dark text-white">
                    <h5 className="card-title">{user.name}</h5>
                    <p className="card-text">
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p className="card-text">
                        <strong>Address: </strong>
                        <span>{user.address_street_number} </span>
                        <span>{user.address_street}, </span>
                        <span>{user.address_city}, </span>
                        <span>{user.address_state} </span>
                        <span>{user.address_zip}</span>
                    </p>
                    <p className="card-text">
                        <strong>Latitude: </strong>
                        {user.address_latitude}
                    </p>
                    <p className="card-text">
                        <strong>Longitude: </strong>
                        {user.address_longitude}
                    </p>
                    <p className="card-text">
                        <strong>Role: </strong>
                        <form>
                            <div clasName="form-group">
                                <input
                                    type="range"
                                    className="form-range"
                                    id="roleRange"
                                    min="0"
                                    max="2"
                                    step="1"
                                    defaultValue={user.role}
                                    onChange={(e) => handleChange(e, user.id)}
                                />    
                                <div className="d-flex justify-content-between">
                                    <span>Basic</span>
                                    <span>Driver</span>
                                    <span>Restaurant</span>
                                </div>
                                <small className="form-text text-white">
                                    Current role: <strong>{user.role}</strong>
                                </small>                                      
                            </div>
                        </form>
                    </p>
                    <p className="card-text">
                        <strong>Restauraunt ID: </strong>
                        <input 
                            type="number"
                            className="bg-dark text-white form-control"
                            defaultValue={user.restaurant_id} 
                            onChange={(e) => handleRestaurantIdChange(e, user.id)} 
                        />
                    </p>
                    <p className="card-text">
                        <strong>Created At: </strong>
                        {new Date(user.created_at).toLocaleString()}
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div>
            <h1>Users List</h1>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {users?.length > 0 ? <Pages /> : ""}
                    {users?.length > 0 ? (
                        <div className="row">
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
