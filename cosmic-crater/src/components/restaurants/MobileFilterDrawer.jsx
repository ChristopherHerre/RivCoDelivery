import React from 'react';
import CityFilter from './CityFilter';
import ActionButtons from './ActionButtons';

/**
 * Mobile filter drawer component
 * Shows filters in a bottom sheet on mobile devices
 */
export default function MobileFilterDrawer({ 
    isOpen, 
    onClose, 
    selectedCities, 
    onCityChange, 
    query, 
    onSearchChange, 
    isSearching,
    searchResultsCount,
    onSuggestClick,
    profile
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-2xl shadow-2xl z-50 sm:hidden max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Filters</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-circle btn-ghost"
                        aria-label="Close filters"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className="p-4 space-y-4">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body p-4">
                            <div className="flex flex-col gap-4">
                                <CityFilter 
                                    selectedCities={selectedCities}
                                    onCityChange={onCityChange}
                                />
                                <div className="form-control">
                                    <div className="label justify-between items-center">
                                        <label htmlFor="mobile-search-item-input" className="label-text text-base-content font-bold">
                                            Filter by item name:
                                        </label>
                                        {query && searchResultsCount > 0 && (
                                            <span className="badge badge-primary badge-sm" aria-label={`${searchResultsCount} ${searchResultsCount === 1 ? 'restaurant' : 'restaurants'} found`}>
                                                {searchResultsCount} found
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            id="mobile-search-item-input"
                                            type="text" 
                                            placeholder="Search for item..." 
                                            className="input input-bordered w-full bg-base-200 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 pr-10" 
                                            value={query} 
                                            onChange={onSearchChange}
                                            aria-describedby="mobile-search-item-description"
                                            aria-busy={isSearching}
                                        />
                                        {isSearching && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm text-primary" aria-label="Searching"></span>
                                        )}
                                    </div>
                                    <div id="mobile-search-item-description" className="sr-only">
                                        Search for menu items across all restaurants
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <ActionButtons 
                        profile={profile}
                        onSuggestClick={onSuggestClick}
                    />
                </div>
            </div>
        </>
    );
}

