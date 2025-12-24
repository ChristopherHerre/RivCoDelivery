import React from 'react';
import { CarouselItem } from './Carousel';

/**
 * Skeleton loading card component for restaurant cards
 */
export default function SkeletonCard() {
    return (
        <CarouselItem>
            <div className="card bg-base-100 w-96 shadow-sm animate-pulse">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-6 bg-gray-300 rounded w-32"></div>
                        <div className="h-6 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="flex justify-end gap-2">
                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                        <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
            </div>
        </CarouselItem>
    );
}

