import React from 'react';

/**
 * A reusable button component that handles all button styling patterns throughout the application.
 * Similar to ResponsiveFlexRow, it provides consistent styling with flexible configuration.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content (text, icons, etc.)
 * @param {string} props.variant - Color variant: 'primary' (blue) | 'secondary' (gray) | 'danger' (red) | 'success' (green) (default: 'primary')
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} props.type - Button type: 'button' | 'submit' | 'reset' (default: 'button')
 * @param {boolean} props.fullWidth - If true, button takes full width (default: false)
 * @param {boolean} props.responsiveFullWidth - If true, button is full width on mobile (max-lg:w-full) (default: false)
 * @param {boolean} props.disabled - Disabled state (default: false)
 * @param {boolean} props.loading - Loading state (shows disabled + opacity) (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {string} props.ariaLabel - Accessibility label
 * @param {boolean} props.iconOnly - If true, button is optimized for icon-only content (default: false)
 * @param {string} props.align - Text alignment: 'left' | 'center' | 'right' (default: 'center')
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    fullWidth = false,
    responsiveFullWidth = false,
    disabled = false,
    loading = false,
    className = '',
    onClick,
    ariaLabel,
    iconOnly = false,
    align = 'center',
    ...props
}) {
    // Color variants
    let colorClasses = 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800';
    if (variant === 'secondary') {
        colorClasses = 'bg-gray-600 hover:bg-gray-700';
    } else if (variant === 'danger') {
        colorClasses = 'bg-red-600 hover:bg-red-700';
    } else if (variant === 'success') {
        colorClasses = 'bg-green-600 hover:bg-green-700';
    }
    
    // Size variants
    let sizeClasses = 'px-4 py-2';
    let textSizeClass = 'text-base';
    if (size === 'sm') {
        sizeClasses = 'px-2 py-1';
        textSizeClass = 'text-sm';
    } else if (size === 'lg') {
        sizeClasses = 'px-6 py-3';
        textSizeClass = 'text-lg';
    } else if (size === 'md-large') {
        // Special size for "View details" buttons
        sizeClasses = 'px-5 py-2.5';
        textSizeClass = 'text-base';
    }
    
    // Base classes
    const baseClasses = 'text-white rounded transition-colors cursor-pointer border-0 font-normal';
    
    // Width classes
    const widthClass = fullWidth ? 'w-full' : '';
    const responsiveWidthClass = responsiveFullWidth ? 'max-lg:w-full max-lg:text-center' : '';
    
    // Alignment
    const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    
    // Icon support - always use flex for proper icon alignment
    const iconClass = 'flex items-center gap-2';
    const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    
    // Disabled/loading state
    const disabledClass = (disabled || loading) ? 'disabled:opacity-50 disabled:cursor-not-allowed opacity-50 cursor-not-allowed' : '';
    
    // Combine all classes
    const allClasses = [
        baseClasses,
        colorClasses,
        sizeClasses,
        textSizeClass,
        widthClass,
        responsiveWidthClass,
        alignClass,
        iconClass,
        justifyClass,
        disabledClass,
        className
    ].filter(Boolean).join(' ');
    
    return (
        <button
            type={type}
            className={allClasses}
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={ariaLabel}
            {...props}
        >
            {loading ? (
                <>
                    <i className="bi bi-hourglass-split"></i>
                    <span>Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
