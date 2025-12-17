import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from './Button';

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
                <Button
                    onClick={handleLike}
                    disabled={loading}
                    variant={liked ? 'danger' : 'secondary'}
                    size="md-large"
                    iconOnly={true}
                    ariaLabel={liked ? 'Unlike' : 'Like'}
                    className={`${liked ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} px-5 py-2.5`}
                >
                    <i className={`bi bi-heart${liked ? '-fill' : ''}`}></i>
                </Button>
            )}
            <span className="text-sm text-white/80">
                {likes} {likes === 1 ? 'like' : 'likes'}
            </span>
        </div>
    );
}
