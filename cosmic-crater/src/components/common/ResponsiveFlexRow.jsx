import React from 'react';

/**
 * A responsive flex container that stacks vertically on screens below 1024px
 * and displays horizontally on larger screens. Useful for content with buttons on the right.
 * Automatically makes buttons/links full-width when stacked.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display (typically left content and right button)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.justify - Flex justify value: 'between' | 'end' | 'start' (default: 'between')
 * @param {string} props.align - Flex align value: 'center' | 'start' | 'stretch' (default: 'center')
 */
export default function ResponsiveFlexRow({ 
    children, 
    className = '', 
    justify = 'between',
    align = 'center'
}) {
    const justifyClass = justify === 'end' ? 'justify-end' : justify === 'start' ? 'justify-start' : 'justify-between';
    const alignClass = align === 'start' ? 'items-start' : align === 'stretch' ? 'items-stretch' : 'items-center';
    const alignStackClass = align === 'stretch' ? 'max-lg:items-stretch' : 'max-lg:items-start';
    
    // Helper function to check if an element is a button, link, or Link component
    const isInteractiveElement = (element) => {
        if (!React.isValidElement(element)) return false;
        const type = element.type;
        // Check for native HTML elements
        if (type === 'button' || type === 'a') return true;
        // Check for React Router Link component - check for 'to' prop which is unique to Link
        if (element.props && element.props.to !== undefined) return true;
        // Check by displayName as fallback
        if (typeof type === 'function' && type.displayName === 'Link') return true;
        return false;
    };
    
    // Recursively process children to find and update interactive elements
    const processChildren = (childrenToProcess) => {
        return React.Children.map(childrenToProcess, (child) => {
            if (!React.isValidElement(child)) return child;
            
            // If this is an interactive element, add full-width classes
            if (isInteractiveElement(child)) {
                const existingClass = child.props.className || child.props.class || '';
                // Remove whitespace-nowrap and add full-width classes
                const cleanedClass = existingClass.replace(/\bwhitespace-nowrap\b/g, '').trim();
                const newClass = cleanedClass 
                    ? `${cleanedClass} max-lg:w-full max-lg:whitespace-normal`.trim()
                    : 'max-lg:w-full';
                
                return React.cloneElement(child, {
                    className: newClass,
                    class: undefined
                });
            }
            
            // If this is a div or other container, process its children recursively
            if (child.props && child.props.children) {
                const processedChildren = processChildren(child.props.children);
                const existingClass = child.props.className || child.props.class || '';
                // Also make wrapper divs full-width when stacked
                const wrapperClass = existingClass.includes('max-lg:w-full') 
                    ? existingClass 
                    : `${existingClass} max-lg:w-full`.trim();
                
                return React.cloneElement(child, {
                    className: wrapperClass,
                    class: undefined,
                    children: processedChildren
                });
            }
            
            return child;
        });
    };
    
    return (
        <div 
            className={`flex ${justifyClass} ${alignClass} max-lg:flex-col max-lg:gap-2 ${alignStackClass} max-lg:items-stretch ${className}`}
        >
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child)) {
                    // Make all children except the first one full-width when stacked (typically buttons/actions)
                    if (index > 0) {
                        // Process children recursively to find and update all interactive elements
                        const processedChild = processChildren([child])[0];
                        return processedChild;
                    }
                }
                return child;
            })}
        </div>
    );
}

