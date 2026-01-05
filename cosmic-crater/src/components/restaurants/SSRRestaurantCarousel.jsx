import React, { useState, useEffect } from 'react';
import Carousel, { CarouselItem } from '../common/Carousel';
import LikeButton from '../common/LikeButton';

/**
 * SSR Restaurant Carousel Component
 * Wrapper for Carousel that displays restaurants in a carousel format for SSR pages
 */
export default function SSRRestaurantCarousel({ 
    restaurants, 
    city, 
    categoryIndex,
    categoryUrl 
}) {
    const [profile, setProfile] = useState(null);

    // Load profile from localStorage on client side
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            try {
                setProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error('Error parsing profile:', e);
            }
        }

        // Listen for profile changes
        const handleProfileChange = () => {
            const updatedProfile = localStorage.getItem('profile');
            if (updatedProfile) {
                try {
                    setProfile(JSON.parse(updatedProfile));
                } catch (e) {
                    console.error('Error parsing profile:', e);
                }
            } else {
                setProfile(null);
            }
        };

        window.addEventListener('profile-changed', handleProfileChange);
        return () => window.removeEventListener('profile-changed', handleProfileChange);
    }, []);

    const slugify = (name) =>
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    return (
        <Carousel
            id={`ssr-carousel-${categoryIndex}`}
            scrollAmount={400}
            carouselClassName="px-4"
            aria-label={`${restaurants[0]?.category || 'Restaurants'} carousel`}
        >
            {restaurants.map((r) => {
                const slug = slugify(r.name);
                return (
                    <CarouselItem key={r.id}>
                        <div className="card bg-base-100 w-96 shadow-sm hover:shadow-lg transition-shadow duration-200 ease-in-out">
                            <div className="card-body">
                                <h2 className="card-title">
                                    <a 
                                        href={`/restaurants/${city}/${r.id}-${slug}`} 
                                        className="text-white link link-hover no-underline"
                                    >
                                        {r.name}
                                    </a>
                                    <div className="badge badge-secondary badge-lg">{r.category}</div>
                                </h2>
                                <p className="text-base-content/70">{r.address}</p>
                                <div className="card-actions justify-end items-center">
                                    <a
                                        href={`/restaurants/${city}/${r.id}-${slug}`}
                                        className="btn btn-primary btn-sm bg-primary text-primary-content"
                                    >
                                        View menu
                                    </a>
                                    <LikeButton 
                                        itemId={r.id} 
                                        itemType="restaurant" 
                                        initialLikes={r.likes || 0} 
                                        initialLiked={false}
                                        profile={profile}
                                    />
                                </div>
                            </div>
                        </div>
                    </CarouselItem>
                );
            })}
        </Carousel>
    );
}

