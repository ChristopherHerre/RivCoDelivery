import React, { useEffect, useRef, useState } from 'react';
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

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        // Initial check
        updateScrollState();

        // Update on scroll
        const handleScroll = () => {
            updateScrollState();
        };

        // Update on resize
        const handleResize = () => {
            updateScrollState();
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
                    // Swipe left - scroll right
                    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                } else if (diff < 0 && canScrollLeft) {
                    // Swipe right - scroll left
                    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
            }
        };

        carousel.addEventListener('scroll', handleScroll);
        carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
        carousel.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('resize', handleResize);

        // Check periodically for dynamic content
        const interval = setInterval(updateScrollState, 100);

        return () => {
            carousel.removeEventListener('scroll', handleScroll);
            carousel.removeEventListener('touchstart', handleTouchStart);
            carousel.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('resize', handleResize);
            clearInterval(interval);
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
                    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
                className={`carousel w-full carousel-center rounded-box ${space} overflow-x-auto flex items-center`} 
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
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                            <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                className="btn-circle !px-0 !py-0 w-11 h-11 min-[640px]:w-8 min-[640px]:h-8"
                                aria-label="Previous"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const carousel = carouselRef.current;
                                    if (carousel) {
                                        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                                    }
                                }}
                            >
                                ❮
                            </Button>
                        </div>
                    )}
                    {canScrollRight && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                            <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                className="btn-circle !px-0 !py-0 w-11 h-11 min-[640px]:w-8 min-[640px]:h-8"
                                aria-label="Next"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const carousel = carouselRef.current;
                                    if (carousel) {
                                        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                                    }
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
