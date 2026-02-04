/**
 * Profile Permission Helpers
 * 
 * Centralized permission checking for JobProfile, FreelancerProfile, and PersonalProfile
 */

import { normalizeRole, ROLES, LEGACY_ROLES } from '../constants/roles.js';

/**
 * Helper to check if user is owner of profile
 */
const isOwner = (user, profile) => {
  if (!user || !profile) return false;
  const ownerId = profile.ownerUserId?._id || profile.ownerUserId;
  return ownerId === user._id;
};

/**
 * JobProfile Permissions
 */

// View permission (all users + admin)
export const canViewJobProfile = (user, profile) => {
  // All authenticated users can view
  return !!user;
};

// Edit permission (owner + admin)
export const canEditJobProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN;
};

// Delete permission (owner + admin)
export const canDeleteJobProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN;
};

// Create permission (all authenticated users)
export const canCreateJobProfile = (user) => {
  return !!user;
};

/**
 * FreelancerProfile Permissions
 */

// View permission: owner, boss, admin
export const canViewFreelancerProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN ||
         user.role === LEGACY_ROLES.BOSS; // BOSS maps to ADMIN
};

// Edit permission: boss, admin, owner
export const canEditFreelancerProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN ||
         user.role === LEGACY_ROLES.BOSS; // BOSS maps to ADMIN
};

// Delete permission: boss, admin, owner
export const canDeleteFreelancerProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN ||
         user.role === LEGACY_ROLES.BOSS; // BOSS maps to ADMIN
};

// Create permission: boss, admin, owner
export const canCreateFreelancerProfile = (user) => {
  if (!user) return false;
  
  const userRole = normalizeRole(user.role);
  
  return userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN ||
         user.role === LEGACY_ROLES.BOSS; // BOSS maps to ADMIN
};

/**
 * PersonalProfile Permissions
 */

// View permission: owner, boss, admin
export const canViewPersonalProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  const userRole = normalizeRole(user.role);
  const owner = isOwner(user, profile);
  
  return owner || 
         userRole === ROLES.ADMIN || 
         userRole === ROLES.SUPER_ADMIN ||
         user.role === LEGACY_ROLES.BOSS; // BOSS maps to ADMIN
};

// Edit permission (STRICT - owner only, even admin cannot edit)
export const canEditPersonalProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  // Only owner can edit, even admin/boss cannot
  return isOwner(user, profile);
};

// Delete permission (STRICT - owner only)
export const canDeletePersonalProfile = (user, profile) => {
  if (!user || !profile) return false;
  
  // Only owner can delete
  return isOwner(user, profile);
};

// Create permission (all authenticated users can create their own)
export const canCreatePersonalProfile = (user) => {
  return !!user;
};
