import React from 'react';
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
    space = 'space-x-4'
}) {
    if (!id) {
        console.warn('Carousel component requires an id prop');
    }

    return (
        <div className={`relative w-full ${className}`}>
            <div className={`carousel w-full carousel-center rounded-box ${space} overflow-x-auto flex items-center`} id={id}>
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
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
                        <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            className="btn-circle !px-0 !py-0 w-8 h-8"
                            aria-label="Previous"
                        onClick={(e) => {
                            e.preventDefault();
                            const carousel = document.getElementById(id);
                            if (carousel) {
                                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                            }
                        }}
                    >
                        ❮
                        </Button>
                    </div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                        <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            className="btn-circle !px-0 !py-0 w-8 h-8"
                            aria-label="Next"
                        onClick={(e) => {
                            e.preventDefault();
                            const carousel = document.getElementById(id);
                            if (carousel) {
                                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                            }
                        }}
                    >
                        ❯
                        </Button>
                    </div>
                </>
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
