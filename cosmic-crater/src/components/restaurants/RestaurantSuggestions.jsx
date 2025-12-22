import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from '../users/Spinner';
import Button from '../common/Button';
import { MAX_RETRY_ATTEMPTS } from '../App';

function RestaurantSuggestions() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSuggestions();
    }, [statusFilter]);

    const fetchSuggestions = async (attempt = 1) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/restaurant-suggestions', {
                params: { status: statusFilter },
                withCredentials: true
            });
            setSuggestions(res.data.suggestions || []);
        } catch (err) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                fetchSuggestions(attempt + 1);
            } else {
                console.error('Error fetching suggestions:', err);
                setMessage({ type: 'error', text: 'Failed to load suggestions' });
                setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this restaurant suggestion?')) {
            return;
        }
        setProcessingId(id);
        try {
            const res = await axios.post(`/api/restaurant-suggestions/${id}/approve`, {}, {
                withCredentials: true
            });
            setMessage({ type: 'success', text: res.data.message || 'Restaurant approved successfully' });
            fetchSuggestions();
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (err) {
            console.error('Error approving suggestion:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to approve suggestion' 
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this restaurant suggestion?')) {
            return;
        }
        setProcessingId(id);
        try {
            const res = await axios.post(`/api/restaurant-suggestions/${id}/reject`, {}, {
                withCredentials: true
            });
            setMessage({ type: 'success', text: res.data.message || 'Restaurant rejected' });
            fetchSuggestions();
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (err) {
            console.error('Error rejecting suggestion:', err);
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to reject suggestion' 
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="w-full">
            <h2 className="mb-4">Restaurant Suggestions</h2>
            
            {/* Status Filter */}
            <div className="mb-4 flex gap-2">
                <Button
                    variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
                    onClick={() => setStatusFilter('pending')}
                    size="sm"
                >
                    Pending
                </Button>
                <Button
                    variant={statusFilter === 'approved' ? 'primary' : 'secondary'}
                    onClick={() => setStatusFilter('approved')}
                    size="sm"
                >
                    Approved
                </Button>
                <Button
                    variant={statusFilter === 'rejected' ? 'primary' : 'secondary'}
                    onClick={() => setStatusFilter('rejected')}
                    size="sm"
                >
                    Rejected
                </Button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 p-3 rounded-lg ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <Spinner />
            ) : suggestions.length === 0 ? (
                <p className="text-gray-400">No {statusFilter} suggestions found.</p>
            ) : (
                <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                        <div 
                            key={suggestion.id} 
                            className="border border-gray-300 rounded-lg p-4 bg-gray-900 text-white"
                        >
                            <div className="flex flex-wrap gap-4 mb-3">
                                <div className="flex-1 min-w-[200px]">
                                    <h3 className="font-semibold text-lg mb-2">{suggestion.name}</h3>
                                    <p className="text-gray-300">
                                        <strong>Category:</strong> {suggestion.category || 'N/A'}
                                    </p>
                                    <p className="text-gray-300">
                                        <strong>Address:</strong> {suggestion.address}
                                    </p>
                                    <p className="text-gray-300">
                                        <strong>City:</strong> {suggestion.city_name || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <p className="text-gray-300">
                                        <strong>Suggested by:</strong> {suggestion.suggested_by_name || suggestion.suggested_by_email || suggestion.suggested_by}
                                    </p>
                                    <p className="text-gray-300">
                                        <strong>Date:</strong> {formatDate(suggestion.created_at)}
                                    </p>
                                    {suggestion.reviewed_at && (
                                        <p className="text-gray-300">
                                            <strong>Reviewed:</strong> {formatDate(suggestion.reviewed_at)}
                                        </p>
                                    )}
                                    <p className="text-gray-300">
                                        <strong>Status:</strong> 
                                        <span className={`ml-2 px-2 py-1 rounded-md text-xs ${
                                            suggestion.status === 'approved' ? 'bg-green-600' :
                                            suggestion.status === 'rejected' ? 'bg-red-600' :
                                            'bg-yellow-600'
                                        }`}>
                                            {suggestion.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            {suggestion.status === 'pending' && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="success"
                                        onClick={() => handleApprove(suggestion.id)}
                                        disabled={processingId === suggestion.id}
                                        size="sm"
                                    >
                                        {processingId === suggestion.id ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Approve
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleReject(suggestion.id)}
                                        disabled={processingId === suggestion.id}
                                        size="sm"
                                    >
                                        {processingId === suggestion.id ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                                <i className="bi bi-x-circle me-2"></i>
                                                Reject
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RestaurantSuggestions;
