import React from 'react';

/**
 * Skeleton loader component for the Navbar
 * Matches the structure of the navbar when loading
 */
export default function NavbarSkeleton() {
    return (
        <div className="card bg-base-100 shadow-md mb-4 w-full sticky top-0 z-50">
            <div className="card-body p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Left Section Skeleton */}
                    <div className="w-full lg:flex-1">
                        <div className="flex flex-col md:flex-row md:flex-nowrap items-start md:items-center gap-4">
                            {/* User Info Skeleton */}
                            <div className="flex items-center gap-2 animate-pulse">
                                <div className="h-4 bg-primary/30 rounded w-16"></div>
                                <div className="w-10 h-10 bg-primary/30 rounded-full"></div>
                                <div className="h-4 bg-primary/30 rounded w-24"></div>
                            </div>
                            {/* Delivery Address Skeleton */}
                            <div className="w-full md:w-auto md:ml-auto flex-shrink-0">
                                <div className="flex items-center gap-2 animate-pulse">
                                    <div className="h-4 bg-primary/30 rounded w-20"></div>
                                    <div className="h-10 bg-primary/30 rounded w-48"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Section Skeleton */}
                    <div className="w-full lg:flex-1 lg:flex lg:justify-end">
                        <div className="flex flex-row gap-3 w-full lg:w-auto animate-pulse">
                            <div className="h-10 bg-primary/30 rounded w-28"></div>
                            <div className="h-10 bg-primary/30 rounded w-20"></div>
                        </div>
                    </div>
                </div>
                {/* Breadcrumbs Skeleton */}
                <div className="mt-4 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="h-4 bg-primary/30 rounded w-16"></div>
                        <div className="h-4 bg-primary/30 rounded w-4"></div>
                        <div className="h-4 bg-primary/30 rounded w-24"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

