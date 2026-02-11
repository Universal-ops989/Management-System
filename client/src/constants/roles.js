/**
 * Role Constants (Client-side)
 * 
 * Mirrors server/src/constants/roles.js
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
  GUEST: 'GUEST'
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
 * Normalize a role (BOSS → ADMIN mapping)
 */
export const normalizeRole = (role) => {
  if (!role) return ROLES.MEMBER;
  if (role === LEGACY_ROLES.BOSS) return ROLES.ADMIN;
  // Return as-is if valid, default to MEMBER if invalid
  return Object.values(ALL_ROLES).includes(role) ? role : ROLES.MEMBER;
};

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
 * Degree options (for user access level) — used in Admin UI selects
 */
export const DEGREE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEAM_BOSS', label: 'Team Boss' },
  { value: 'MEMBER', label: 'Member' }
];

/**
 * Get display name for degree (safe fallback)
 */
export const getDegreeDisplayName = (degree) => {
  if (!degree) return 'N/A';
  const opt = DEGREE_OPTIONS.find(o => o.value === degree);
  if (opt) return opt.label;
  return String(degree).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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

