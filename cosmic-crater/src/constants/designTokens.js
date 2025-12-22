/**
 * Design Tokens for Border Radius
 * 
 * Standardized border radius values for consistent styling across admin panel components.
 * 
 * Usage:
 * - Main containers/forms: Use BORDER_RADIUS.container (rounded-xl)
 * - Cards/boxes: Use BORDER_RADIUS.card (rounded-lg)
 * - Input fields: Use BORDER_RADIUS.input (rounded-lg)
 * - Badges/small elements: Use BORDER_RADIUS.badge (rounded-md)
 */
export const BORDER_RADIUS = {
    container: 'rounded-xl',    // Main form containers (0.75rem / 12px)
    card: 'rounded-lg',          // Cards, boxes (0.5rem / 8px)
    input: 'rounded-lg',         // Input fields (0.5rem / 8px)
    badge: 'rounded-md'          // Badges, small elements (0.375rem / 6px)
};
