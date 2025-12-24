import React from 'react';

/**
 * Empty state component for when no results are found
 * 
 * @param {Object} props
 * @param {string} props.title - Main message title
 * @param {string} props.message - Descriptive message
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {React.ReactNode} props.action - Optional action button/link
 */
export default function EmptyState({ title, message, icon, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && <div className="mb-4 text-6xl text-base-content/30">{icon}</div>}
            <h3 className="text-2xl font-bold text-base-content mb-2">{title}</h3>
            <p className="text-base-content/70 mb-6 max-w-md">{message}</p>
            {action && <div>{action}</div>}
        </div>
    );
}

