import React from 'react';

/**
 * A responsive flex container that stacks vertically on screens below 640px
 * and displays horizontally on larger screens. Useful for content with buttons on the right.
 * 
 * Note: Buttons/links should include these classes for responsive behavior:
 * `max-sm:w-full max-sm:text-center` (and remove `whitespace-nowrap` on small screens)
 * 
 * Nested ResponsiveFlexRow components should use variant="nested" to blend with the parent gradient.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display (typically left content and right button)
 * @param {string} props.className - Additional CSS classes (use sparingly, prefer props)
 * @param {string} props.justify - Flex justify value: 'between' | 'end' | 'start' (default: 'between')
 * @param {string} props.align - Flex align value: 'center' | 'start' | 'stretch' (default: 'center')
 * @param {boolean} props.card - If true, applies card styling (h-full, hover:shadow-md, transition-shadow) (default: false)
 * @param {boolean} props.vertical - If true, forces vertical layout (flex-col) (default: false)
 * @param {boolean} props.borderTop - If true, adds top border with spacing (default: false)
 * @param {string} props.margin - Margin classes: 'mb-6' | 'mb-4' | 'mb-2' | 'mt-auto' (default: '')
 * @param {string} props.variant - Gradient variant: 'primary' | 'nested' | 'restaurant' | 'menu' | 'menuItem' | 'city' | 'ingredient' (default: 'primary')
 */
export default function ResponsiveFlexRow({ 
    children, 
    className = '', 
    justify = 'between',
    align = 'center',
    card = false,
    vertical = false,
    borderTop = false,
    margin = '',
    variant = 'primary'
}) {
    const justifyClass = justify === 'end' ? 'justify-end' : justify === 'start' ? 'justify-start' : 'justify-between';
    const alignClass = align === 'start' ? 'items-start' : align === 'stretch' ? 'items-stretch' : 'items-center';
    const alignStackClass = align === 'stretch' ? 'max-sm:items-stretch' : 'max-sm:items-start';
    
    // No background colors, shadows, or borders - completely transparent
    const backgroundClass = '';
    const shadowClass = '';
    const paddingClass = variant === 'nested' ? '' : 'p-4';
    const roundedClass = '';
    
    // Build base classes
    const baseClasses = `${backgroundClass} ${shadowClass} ${roundedClass} ${paddingClass} flex`;
    const cardClasses = card ? 'h-full' : '';
    // When vertical is true, always use flex-col; otherwise only on small screens
    const verticalClass = vertical ? 'flex-col' : '';
    const responsiveVerticalClass = vertical ? '' : 'max-sm:flex-col';
    const borderTopClass = borderTop ? 'mt-auto pt-2' : '';
    const marginClass = margin || '';
    
    // Combine all classes
    const allClasses = [
        baseClasses,
        justifyClass,
        alignClass,
        verticalClass,
        cardClasses,
        borderTopClass,
        marginClass,
        responsiveVerticalClass,
        'max-sm:gap-2',
        alignStackClass,
        'max-sm:items-stretch',
        className
    ].filter(Boolean).join(' ');
    
    return (
        <div className={allClasses}>
            {children}
        </div>
    );
}

