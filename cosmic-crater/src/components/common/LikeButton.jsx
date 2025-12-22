import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function LikeButton({ itemId, itemType, initialLikes = 0, initialLiked = false, profile }) {
    const [likes, setLikes] = useState(initialLikes);
    const [liked, setLiked] = useState(initialLiked);
    const [loading, setLoading] = useState(false);

    // Update state when props change
    useEffect(() => {
        setLikes(initialLikes);
        setLiked(initialLiked);
    }, [initialLikes, initialLiked]);

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!profile?.sub) {
            // User not signed in - could show a message or redirect to login
            return;
        }

        if (loading) return;

        setLoading(true);
        try {
            const endpoint = itemType === 'restaurant' 
                ? `/api/restaurants/${itemId}/like`
                : `/api/menu-items/${itemId}/like`;
            
            const response = await axios.post(endpoint, {}, { withCredentials: true });
            setLikes(response.data.likes);
            setLiked(response.data.liked);
        } catch (error) {
            console.error('Error toggling like:', error);
            // Optionally show error message to user
        } finally {
            setLoading(false);
        }
    };

    // Show like count to everyone, but only show button if signed in
    return (
        <div className="flex items-center gap-2">
            {profile?.sub && (
                <button
                    onClick={handleLike}
                    disabled={loading}
                    className={`btn btn-sm btn-circle group ${
                        liked
                            // Active: solid pink, hover to pink outline (border/background only)
                            ? 'bg-pink-500 text-white border-pink-500 hover:bg-transparent hover:border-pink-500'
                            // Inactive: filled primary, hover switches to outline
                            : 'bg-primary text-primary-content border-primary hover:bg-transparent hover:text-primary hover:border-primary'
                    }`}
                    aria-label={liked ? 'Unlike' : 'Like'}
                >
                    {loading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <i
                            className={`bi bi-heart${liked ? '-fill' : ''} ${
                                liked ? 'text-white group-hover:text-pink-500' : ''
                            }`}
                        ></i>
                    )}
                </button>
            )}
            <span className="text-sm text-base-content/70">
                {likes} {likes === 1 ? 'like' : 'likes'}
            </span>
        </div>
    );
}
