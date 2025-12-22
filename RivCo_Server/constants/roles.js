/**
 * User Roles Enum
 * 
 * Defines the role hierarchy for the application:
 * - USER: Basic user (0) - Can place orders, view menus
 * - DRIVER: Driver (1) - Can view and manage orders
 * - ADMIN: Restaurant Owner/Admin (2) - Full access to restaurant management
 * 
 * Roles follow a hierarchy where higher numbers have more permissions.
 * The checkRole middleware allows access if user.role >= requiredRole.
 */
const ROLES = {
    USER: 0,
    DRIVER: 1,
    ADMIN: 2
};

/**
 * Role names for display purposes
 */
const ROLE_NAMES = {
    [ROLES.USER]: 'Basic User',
    [ROLES.DRIVER]: 'Driver',
    [ROLES.ADMIN]: 'Restaurant/Admin'
};

/**
 * Get role name by role value
 * @param {number} role - The role number
 * @returns {string} The role name
 */
function getRoleName(role) {
    return ROLE_NAMES[role] || 'Unknown';
}

/**
 * Check if a role value is valid
 * @param {number} role - The role number to validate
 * @returns {boolean} True if valid
 */
function isValidRole(role) {
    return Object.values(ROLES).includes(Number(role));
}

module.exports = {
    ROLES,
    ROLE_NAMES,
    getRoleName,
    isValidRole
};
