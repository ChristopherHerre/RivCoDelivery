import React, { useEffect, useState } from 'react';
import { API_URL, MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from './Spinner';
import axios from 'axios';

function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchUsers = async (attempt = 1) => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/users`, {
                    params: { page, limit: 5 },
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
    }, [page]);

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
    const [value, setValue] = useState(1); // Default value for the slider (Medium)

    const handleChange = (event) => {
      setValue(event.target.value);
    };
  
    const getRoleLabel = (value) => {
      switch (value) {
        case '0':
          return 'Low';
        case '1':
          return 'Medium';
        case '2':
          return 'High';
        default:
          return 'Medium';
      }
    };
    return (
        <div className="container">
            <h1>Users List</h1>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {users.length > 0 ? <Pages /> : ""}
                    {users.length > 0 ? (
                        <div className="row">
                            {users.map(user => (
                                <div key={user.id} className="col-md-6 col-lg-4 mb-3">
                                    <div className="card p-3 shadow-sm">
                                        <h5 className="card-title">{user.name}</h5>
                                        <p className="card-text">
                                            <strong>Email:</strong> {user.email}
                                        </p>
                                        <p className="card-text">
                                            <strong>Street Number: </strong>
                                            {user.address_street_number}
                                        </p>
                                        <p className="card-text">
                                            <strong>Address: </strong>
                                            {user.address_street}, {user.address_city}, {user.address_state} {user.address_zip}
                                        </p>
                                        <p className="card-text">
                                            <strong>Coordinates: </strong>
                                            {user.address_latitude}, {user.address_longitude}
                                        </p>
                                        <p className="card-text">
                                            <strong>Role: </strong>
                                            <form>
                                                <div clasName="form-group">
                                                    <label for="formControlRange">Example Range input</label>
                                                    <input
                                                        type="range"
                                                        className="form-range"
                                                        id="roleRange"
                                                        min="0"
                                                        max="2"
                                                        step="1"
                                                        value={user.role}
                                                        onChange={handleChange}
                                                    />    
                                                    <div className="d-flex justify-content-between">
                                                        <span>Basic</span>
                                                        <span>Driver</span>
                                                        <span>Restaurant</span>
                                                    </div>
                                                    <small className="form-text text-muted">
                                                        Current role: <strong>{user.role || getRoleLabel(user.role)}</strong>
                                                    </small>                                      
                                                </div>
                                            </form>
                                        </p>
                                        <p className="card-text">
                                            <strong>Created At: </strong>
                                            {new Date(user.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No users found.</p>
                    )}
                    {users.length > 0 ? <Pages /> : ""}
                </>
            )}
        </div>
    );
}

export default Users;
