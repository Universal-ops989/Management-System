/**
 * Role Constants and Mapping
 * 
 * PRD v3.0 Role System:
 * - SUPER_ADMIN: System configuration, bypass all checks
 * - ADMIN: Team oversight, admin features (mapped from BOSS)
 * - MEMBER: Default user, own data only
 * - GUEST: Read-only access (optional)
 * 
 * Migration Notes:
 * - BOSS → ADMIN (automatic mapping via roleMapper)
 * - Existing BOSS users will be treated as ADMIN
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
  TEAM_BOSS:'ADMIN'
};

// Legacy role for backward compatibility
export const LEGACY_ROLES = {
  BOSS: 'BOSS' // Maps to ADMIN
};

// All valid roles (including legacy)
export const ALL_ROLES = {
  ...ROLES,
  ...LEGACY_ROLES
};

// Admin-level roles (can perform admin actions)
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

// Roles that can bypass ownership checks (read-only admin access)
export const OVERRIDE_ROLES = [ROLES.SUPER_ADMIN];

// Roles that can view team data (but not sensitive personal data)
export const TEAM_VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/**
 * Check if a role is a valid admin role
 */
export const isAdminRole = (role) => {
  if (!role) return false;
  // BOSS maps to ADMIN, so treat it as admin
  return ADMIN_ROLES.includes(role) || role === LEGACY_ROLES.BOSS;
};

/**
 * Check if a role can override ownership
 */
export const canOverrideOwnership = (role) => {
  if (!role) return false;
  return OVERRIDE_ROLES.includes(role);
};

/**
 * Check if a role can view team data
 */
export const canViewTeamData = (role) => {
  if (!role) return false;
  // BOSS maps to ADMIN, so treat it as team view
  return TEAM_VIEW_ROLES.includes(role) || role === LEGACY_ROLES.BOSS;
};

/**
 * Get normalized role (maps BOSS → ADMIN)
 * This is the function that should be used throughout the codebase
 */
export const normalizeRole = (role) => {
  if (!role) return ROLES.MEMBER;
  if (role === LEGACY_ROLES.BOSS) return ROLES.ADMIN;
  // Return as-is if valid, default to MEMBER if invalid
  return Object.values(ALL_ROLES).includes(role) ? role : ROLES.MEMBER;
};

/**
 * Check if role is valid
 */
export const isValidRole = (role) => {
  if (!role) return false;
  return Object.values(ALL_ROLES).includes(role);
};

