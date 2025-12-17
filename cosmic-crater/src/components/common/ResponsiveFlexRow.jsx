import React from 'react';

/**
 * A responsive flex container that stacks vertically on screens below 1024px
 * and displays horizontally on larger screens. Useful for content with buttons on the right.
 * 
 * Note: Buttons/links should include these classes for responsive behavior:
 * `max-lg:w-full max-lg:text-center` (and remove `whitespace-nowrap` on small screens)
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
    const alignStackClass = align === 'stretch' ? 'max-lg:items-stretch' : 'max-lg:items-start';
    
    // Different gradients for different object types
    let backgroundClass = 'bg-gradient-to-r from-indigo-500 to-pink-500'; // default/primary
    if (variant === 'nested') {
        // Nested components have no background - they blend with parent
        backgroundClass = 'bg-transparent';
    } else if (variant === 'city') {
        backgroundClass = 'bg-gradient-to-r from-yellow-500 to-amber-500';
    } else if (variant === 'restaurant') {
        backgroundClass = 'bg-gradient-to-r from-blue-500 to-yellow-500';
    } else if (variant === 'menu') {
        backgroundClass = 'bg-gradient-to-r from-blue-900 to-amber-500';
    } else if (variant === 'menuItem') {
        backgroundClass = 'bg-gradient-to-r from-red-500 to-orange-500';
    } else if (variant === 'ingredient') {
        backgroundClass = 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
    
    const shadowClass = variant === 'nested' ? '' : 'shadow-lg';
    const paddingClass = variant === 'nested' ? '' : 'p-6';
    const roundedClass = variant === 'nested' ? '' : 'rounded-xl';
    
    // Build base classes
    const baseClasses = `${backgroundClass} ${shadowClass} ${roundedClass} ${paddingClass} flex`;
    const cardClasses = card ? 'h-full hover:shadow-md transition-shadow' : '';
    // When vertical is true, always use flex-col; otherwise only on small screens
    const verticalClass = vertical ? 'flex-col' : '';
    const responsiveVerticalClass = vertical ? '' : 'max-lg:flex-col';
    const borderTopClass = borderTop && variant !== 'nested' ? 'mt-auto pt-2 border-t border-white/30' : borderTop && variant === 'nested' ? 'mt-auto pt-2' : '';
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
        'max-lg:gap-2',
        alignStackClass,
        'max-lg:items-stretch',
        className
    ].filter(Boolean).join(' ');
    
    return (
        <div className={allClasses}>
            {children}
        </div>
    );
}

