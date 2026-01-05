import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Button from './Button';

/**
 * Reusable carousel component with navigation buttons
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Carousel items to display
 * @param {string} props.id - Unique ID for the carousel (required for navigation)
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.scrollAmount - Amount to scroll on button click (default: 400)
 * @param {boolean} props.showNavigation - Whether to show navigation buttons (default: true)
 * @param {string} props.space - Spacing between items (default: 'space-x-4')
 */
export default function Carousel({ 
    children, 
    id, 
    className = '', 
    carouselClassName = '',
    scrollAmount = 400,
    showNavigation = true,
    space = 'space-x-4',
    'aria-label': ariaLabel = 'Carousel',
    showScrollIndicators = true
}) {
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [maxScroll, setMaxScroll] = useState(0);

    if (!id) {
        console.warn('Carousel component requires an id prop');
    }

    const updateScrollState = () => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const { scrollLeft, scrollWidth, clientWidth } = carousel;
        setScrollPosition(scrollLeft);
        setMaxScroll(scrollWidth - clientWidth);
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollToNext = (direction) => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        // Find all carousel item elements
        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length === 0) {
            // Fallback to fixed scroll amount if no items found
            carousel.scrollBy({ 
                left: direction === 'next' ? scrollAmount : -scrollAmount, 
                behavior: 'smooth' 
            });
            return;
        }

        // Find the first visible item (fully or partially visible)
        let firstVisibleIndex = -1;
        const carouselRect = carousel.getBoundingClientRect();
        
        // First try to find a fully visible item
        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            // Check if item is fully visible (not cut off on either side)
            if (rect.left >= carouselRect.left && rect.right <= carouselRect.right) {
                if (firstVisibleIndex === -1) {
                    firstVisibleIndex = index;
                }
            }
        });

        // If no fully visible item, use the first partially visible one
        if (firstVisibleIndex === -1) {
            items.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                // Check if item is at least partially visible
                if (rect.left < carouselRect.right && rect.right > carouselRect.left) {
                    if (firstVisibleIndex === -1) {
                        firstVisibleIndex = index;
                    }
                }
            });
        }

        // If still no visible item, use the first item
        if (firstVisibleIndex === -1) {
            firstVisibleIndex = 0;
        }

        // Calculate target index
        let targetIndex;
        if (direction === 'next') {
            targetIndex = firstVisibleIndex + 1;
            if (targetIndex >= items.length) targetIndex = items.length - 1;
        } else {
            targetIndex = firstVisibleIndex - 1;
            if (targetIndex < 0) targetIndex = 0;
        }

        // Scroll to the target item
        if (targetIndex >= 0 && targetIndex < items.length) {
            items[targetIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'start' 
            });
        }
    };

    // Reset scroll position to align first card with heading padding on initial load
    // This ensures cards align with heading padding on initial load
    useLayoutEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;
        
        // Force scroll to 0 to show the spacer div and align with heading padding
        carousel.scrollLeft = 0;
        
        // Use a small timeout to ensure this happens after any CSS centering effects
        // from carousel-center class
        const timeoutId = setTimeout(() => {
            carousel.scrollLeft = 0;
            updateScrollState();
        }, 0);
        
        updateScrollState();
        
        return () => clearTimeout(timeoutId);
    }, [children]);

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        // Initial check
        updateScrollState();

        // Update on scroll
        const handleScroll = () => {
            updateScrollState();
        };

        // Update on resize and reset scroll position if needed
        let resizeTimeout;
        const handleResize = () => {
            // Clear any pending resize calls
            clearTimeout(resizeTimeout);
            
            // Debounce resize to avoid excessive calls
            resizeTimeout = setTimeout(() => {
                // Reset scroll position to ensure proper centering after orientation change
                const currentScroll = carousel.scrollLeft;
                
                // If scroll position is near the start, reset to 0 to ensure centering
                // This helps with orientation changes where the layout recalculates
                if (currentScroll < 50) {
                    carousel.scrollLeft = 0;
                }
                
                updateScrollState();
            }, 100);
        };

        // Handle orientation change specifically
        const handleOrientationChange = () => {
            // Small delay to allow layout to recalculate
            setTimeout(() => {
                // Reset to start to ensure proper centering
                carousel.scrollLeft = 0;
                updateScrollState();
            }, 150);
        };

        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        const handleTouchStart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
        };

        const handleTouchEnd = (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        };

        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0 && canScrollRight) {
                    // Swipe left - scroll right (next)
                    scrollToNext('next');
                } else if (diff < 0 && canScrollLeft) {
                    // Swipe right - scroll left (previous)
                    scrollToNext('prev');
                }
            }
        };

        carousel.addEventListener('scroll', handleScroll);
        carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
        carousel.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        // Check periodically for dynamic content
        const interval = setInterval(updateScrollState, 100);

        return () => {
            carousel.removeEventListener('scroll', handleScroll);
            carousel.removeEventListener('touchstart', handleTouchStart);
            carousel.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
            clearInterval(interval);
            clearTimeout(resizeTimeout);
        };
    }, [children, scrollAmount, canScrollLeft, canScrollRight]);

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleKeyDown = (e) => {
            if (!carousel) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    scrollToNext('prev');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    scrollToNext('next');
                    break;
                case 'Home':
                    e.preventDefault();
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                    break;
                case 'End':
                    e.preventDefault();
                    carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' });
                    break;
                default:
                    break;
            }
        };

        carousel.addEventListener('keydown', handleKeyDown);
        return () => {
            carousel.removeEventListener('keydown', handleKeyDown);
        };
    }, [scrollAmount]);

    return (
        <div className={`relative w-full ${className}`}>
            <div 
                ref={carouselRef}
                className={`carousel w-full ${carouselClassName ? '' : 'carousel-center'} rounded-box ${space} overflow-x-auto flex items-center`} 
                id={id}
                role="region"
                aria-label={ariaLabel}
                tabIndex="0"
            >
                {carouselClassName ? (
                    <>
                        {carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-12"></div>}
                        {carouselClassName.includes('px-8') && !carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-8"></div>}
                        {carouselClassName.includes('px-4') && !carouselClassName.includes('px-8') && !carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-4"></div>}
                        {children}
                        {carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-12"></div>}
                        {carouselClassName.includes('px-8') && !carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-8"></div>}
                        {carouselClassName.includes('px-4') && !carouselClassName.includes('px-8') && !carouselClassName.includes('px-12') && <div className="flex-shrink-0 w-4"></div>}
                    </>
                ) : (
                    children
                )}
            </div>
            {showNavigation && (
                <>
                    {canScrollLeft && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                            <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                className="btn-circle !px-0 !py-0 w-8 h-8"
                                aria-label="Previous"
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToNext('prev');
                                }}
                            >
                                ❮
                            </Button>
                        </div>
                    )}
                    {canScrollRight && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                            <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                className="btn-circle !px-0 !py-0 w-8 h-8"
                                aria-label="Next"
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToNext('next');
                                }}
                            >
                                ❯
                            </Button>
                        </div>
                    )}
                </>
            )}
            {showScrollIndicators && maxScroll > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                    <div 
                        className="h-1 bg-primary/30 rounded-full transition-all duration-200"
                        style={{ width: `${(scrollPosition / maxScroll) * 100}%`, maxWidth: '100px' }}
                        aria-hidden="true"
                    ></div>
                </div>
            )}
        </div>
    );
}

/**
 * Carousel item wrapper component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the carousel item
 * @param {string} props.className - Additional CSS classes
 */
export function CarouselItem({ children, className = '' }) {
    return (
        <div className={`carousel-item flex-shrink-0 flex items-center ${className}`}>
            {children}
        </div>
    );
}
