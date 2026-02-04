/**
 * Role Mapping Utility
 * 
 * Provides backward compatibility for role migration:
 * - BOSS → ADMIN (automatic mapping)
 * - All existing BOSS users are treated as ADMIN
 * 
 * Usage:
 * - Use normalizeRole() to get current role value (BOSS becomes ADMIN)
 * - Use isAdminRole() to check admin privileges (BOSS returns true)
 * - User model still stores 'BOSS' for existing users until migration script runs
 */

import { 
  ROLES, 
  LEGACY_ROLES, 
  normalizeRole, 
  isAdminRole,
  canOverrideOwnership,
  canViewTeamData
} from '../constants/roles.js';

/**
 * Normalize a role (BOSS → ADMIN mapping)
 * Use this when you need the current role value
 */
export const getNormalizedRole = (role) => {
  return normalizeRole(role);
};

/**
 * Check if user has admin privileges (including legacy BOSS)
 */
export const hasAdminPrivileges = (user) => {
  if (!user || !user.role) return false;
  return isAdminRole(user.role);
};

/**
 * Check if user can override ownership checks
 */
export const canUserOverrideOwnership = (user) => {
  if (!user || !user.role) return false;
  return canOverrideOwnership(user.role);
};

/**
 * Check if user can view team data
 */
export const canUserViewTeamData = (user) => {
  if (!user || !user.role) return false;
  return canViewTeamData(user.role);
};

/**
 * Check if user has a specific role (with normalization)
 */
export const hasRole = (user, role) => {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === normalizeRole(role);
};

/**
 * Check if user has any of the specified roles (with normalization)
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.role) return false;
  const userRole = normalizeRole(user.role);
  return roles.some(role => normalizeRole(role) === userRole);
};

/**
 * Get role display name (for UI)
 */
export const getRoleDisplayName = (role) => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case ROLES.SUPER_ADMIN:
      return 'Super Admin';
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.MEMBER:
      return 'Member';
    case ROLES.GUEST:
      return 'Guest';
    default:
      return role || 'Unknown';
  }
};

/**
 * Migration helper: Check if role needs migration
 */
export const needsRoleMigration = (role) => {
  return role === LEGACY_ROLES.BOSS;
};

// Re-export commonly used items from constants/roles.js for convenience
export { ROLES, LEGACY_ROLES, normalizeRole, isAdminRole, canOverrideOwnership, canViewTeamData };

