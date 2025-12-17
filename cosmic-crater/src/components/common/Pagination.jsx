import React from 'react';
import Button from './Button';

/**
 * Reusable pagination component with page numbers, total count, and last page display
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {Function} props.onPageChange - Callback when page changes: (newPage) => void
 * @param {number} [props.totalPages] - Total number of pages (default: 1)
 * @param {number} [props.total] - Total number of items (optional, for display)
 * @param {string} [props.itemName] - Name of items being paginated (e.g., "users", "orders") for display (default: "items")
 * @param {number} [props.maxVisiblePages] - Maximum number of page number buttons to show (default: 10)
 * @param {boolean} [props.loading] - Loading state (default: false)
 */
export default function Pagination({
    currentPage,
    onPageChange,
    totalPages = 1,
    total = 0,
    itemName = 'items',
    maxVisiblePages = 10,
    loading = false
}) {
    // Handle page change
    const handlePageClick = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };

    // Calculate which page numbers to show (up to maxVisiblePages)
    const getPageNumbers = () => {
        const pages = [];

        // If totalPages is 0 or invalid, return empty array
        if (!totalPages || totalPages <= 0) {
            return pages;
        }

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is maxVisiblePages or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate start and end of the visible range around current page
            let start = Math.max(2, currentPage - 4);
            let end = Math.min(totalPages - 1, currentPage + 5);

            // Adjust if we're near the beginning
            if (currentPage <= 5) {
                end = Math.min(totalPages - 1, maxVisiblePages - 1);
            }

            // Adjust if we're near the end
            if (currentPage >= totalPages - 4) {
                start = Math.max(2, totalPages - (maxVisiblePages - 2));
            }

            // Add ellipsis after first page if needed
            if (start > 2) {
                pages.push('...');
            }

            // Add page numbers in the visible range
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (end < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col items-center justify-center gap-2 my-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                    variant="secondary"
                    onClick={() => handlePageClick(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0 || loading}
                    size="sm"
                >
                    Previous
                </Button>

                {totalPages > 0 && pageNumbers.length > 0 ? (
                    pageNumbers.map((pageNum, index) => {
                        if (pageNum === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                    ...
                                </span>
                            );
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "primary" : "secondary"}
                                onClick={() => handlePageClick(pageNum)}
                                size="sm"
                                className={pageNum === currentPage ? "font-bold" : ""}
                            >
                                {pageNum}
                            </Button>
                        );
                    })
                ) : (
                    <span className="text-gray-400 px-2">
                        {loading ? 'Loading...' : `Page ${currentPage}`}
                    </span>
                )}

                <Button
                    variant="secondary"
                    onClick={() => handlePageClick(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                    size="sm"
                >
                    Next
                </Button>
            </div>

            {totalPages > 0 && (
                <div className="text-sm text-gray-400 text-center">
                    <div>
                        Page {currentPage} of {totalPages}
                        {total > 0 && (
                            <span> ({total} total {total === 1 ? itemName.slice(0, -1) : itemName})</span>
                        )}
                    </div>
                    {totalPages > maxVisiblePages && (
                        <div className="text-gray-500 mt-1">
                            <span>Last page: {totalPages}</span>
                            <span className="ml-2 italic">(showing up to {maxVisiblePages} page links)</span>
                        </div>
                    )}
                    {totalPages <= maxVisiblePages && totalPages > 0 && (
                        <div className="text-gray-500 mt-1">
                            <span>Last page: {totalPages}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
