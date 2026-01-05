import React from 'react';

/**
 * Skeleton loader component for the DeliveryAddress component
 * Matches the structure of the delivery address button
 */
export default function DeliveryAddressSkeleton() {
    return (
        <div className="text-sm md:text-base flex items-center gap-2 animate-pulse">
            <div className="h-10 bg-primary/30 rounded w-48"></div>
        </div>
    );
}

