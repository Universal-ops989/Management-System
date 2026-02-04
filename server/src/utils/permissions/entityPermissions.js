/**
 * Entity-Specific Permission Helpers
 * 
 * Provides ownership-first permission checks for each entity type
 * Uses the base permission helpers from ../permissions.js
 */

import { 
  canView, 
  canEdit, 
  canDelete, 
  canCreate, 
  isOwner,
  getPermissions 
} from '../permissions.js';
import { ROLES } from '../../constants/roles.js';
import { hasAdminPrivileges } from '../roleMapper.js';
import dotenv from 'dotenv';

dotenv.config();

const BOSS_CAN_EDIT_PROJECTS = process.env.BOSS_CAN_EDIT_PROJECTS === 'true';

/**
 * JobProfile Permission Helpers
 */
export const jobProfilePermissions = {
  canView: (user, jobProfile) => {
    return canView(user, jobProfile, {
      ownerField: 'ownerUserId',
      allowAdmin: true
    });
  },

  canEdit: (user, jobProfile) => {
    // Owner can always edit (ownership-first)
    if (isOwner(user, jobProfile, 'ownerUserId')) {
      return { canEdit: true };
    }

    // Admin can edit (team oversight)
    if (hasAdminPrivileges(user)) {
      return { canEdit: true };
    }

    return { canEdit: false, reason: 'You can only edit profiles you own' };
  },

  canDelete: (user, jobProfile) => {
    // Owner can delete their own profiles (ownership-first)
    if (isOwner(user, jobProfile, 'ownerUserId')) {
      return true;
    }

    // Admin can delete (team oversight)
    if (hasAdminPrivileges(user)) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    return canCreate(user, {
      requireEditor: false,
      allowAdmin: true,
      allowMember: false
    });
  },

  getPermissions: (user, jobProfile) => {
    return getPermissions(user, jobProfile, {
      ownerField: 'ownerUserId',
      allowAdmin: true
    });
  }
};

/**
 * JobTicket Permission Helpers
 */
export const jobTicketPermissions = {
  canView: (user, ticket) => {
    // All authenticated users can view all tickets (no assignedUserId filtering)
    return true;
  },

  canEdit: (user, ticket) => {
    // Admin can edit
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return { canEdit: true };
    }

    // All authenticated users can edit tickets
    return { canEdit: true };
  },

  canDelete: (user, ticket) => {
    // Only admin can delete
    return canDelete(user, ticket, {
      requireAdmin: true
    });
  },

  canCreate: (user) => {
    // Anyone authenticated can create tickets
    return canCreate(user, {
      allowMember: true,
      allowAdmin: true
    });
  },

  getPermissions: (user, ticket) => {
    return {
      canView: true,
      canEdit: jobTicketPermissions.canEdit(user, ticket).canEdit,
      canDelete: jobTicketPermissions.canDelete(user, ticket),
      isOwner: false
    };
  }
};

/**
 * Project Permission Helpers
 */
export const projectPermissions = {
  canView: (user, project) => {
    return canView(user, project, {
      ownerField: 'ownerUserId',
      collaboratorField: 'collaboratorUserIds',
      allowAdmin: true,
      allowCollaborator: true
    });
  },

  canEdit: (user, project) => {
    // Owner can always edit
    if (isOwner(user, project, 'ownerUserId')) {
      return { canEdit: true };
    }

    // Collaborators can edit (for tasks within the project)
    if (project.collaboratorUserIds && Array.isArray(project.collaboratorUserIds)) {
      const isCollaborator = project.collaboratorUserIds.some(
        id => id.toString() === user._id.toString()
      );
      if (isCollaborator) {
        return { canEdit: true, reason: 'Collaborator access' };
      }
    }

    // Admin can edit based on env
    if (hasAdminPrivileges(user)) {
      if (BOSS_CAN_EDIT_PROJECTS || user.role === ROLES.SUPER_ADMIN) {
        return { canEdit: true };
      }
    }

    return { canEdit: false, reason: 'Only owner, collaborator, or admin (if enabled) can edit' };
  },

  canDelete: (user, project) => {
    // Owner can delete
    if (isOwner(user, project, 'ownerUserId')) {
      return true;
    }

    // SUPER_ADMIN can delete
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    // Members can create their own projects
    return canCreate(user, {
      allowMember: true,
      allowAdmin: true
    });
  },

  getPermissions: (user, project) => {
    return getPermissions(user, project, {
      ownerField: 'ownerUserId',
      collaboratorField: 'collaboratorUserIds',
      allowAdmin: true,
      allowCollaborator: true
    });
  }
};

/**
 * Task Permission Helpers
 */
export const taskPermissions = {
  canView: (user, task, project) => {
    // Use project permissions for task access
    if (project) {
      return projectPermissions.canView(user, project);
    }
    // Fallback: anyone can view if project is accessible (will need project lookup)
    return true;
  },

  canEdit: (user, task, project) => {
    // Use project permissions for task edit
    if (project) {
      return projectPermissions.canEdit(user, project);
    }
    return { canEdit: false, reason: 'Project context required' };
  },

  canDelete: (user, task, project) => {
    // Use project permissions for task delete
    if (project) {
      return projectPermissions.canDelete(user, project);
    }
    return false;
  },

  canCreate: (user, project) => {
    // Use project permissions for task create
    if (project) {
      return projectPermissions.canEdit(user, project).canEdit;
    }
    return false;
  }
};

/**
 * Interview Permission Helpers
 */
export const interviewPermissions = {
  canView: (user, interview) => {
    // Admin can view all
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Creator can view
    if (interview.createdByUserId && interview.createdByUserId.toString() === user._id.toString()) {
      return true;
    }

    // All authenticated users can view all interviews
    return true;
  },

  canEdit: (user, interview) => {
    // Admin can edit
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return { canEdit: true };
    }

    // Creator can edit
    if (interview.createdByUserId && interview.createdByUserId.toString() === user._id.toString()) {
      return { canEdit: true };
    }

    return { canEdit: false, reason: 'Insufficient permissions' };
  },

  canDelete: (user, interview) => {
    // Admin can delete
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Creator can delete
    if (interview.createdByUserId && interview.createdByUserId.toString() === user._id.toString()) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    // Anyone authenticated can create interviews
    return canCreate(user, {
      allowMember: true,
      allowAdmin: true
    });
  }
};

/**
 * FinanceTransaction Permission Helpers
 */
export const financeTransactionPermissions = {
  canView: (user, transaction) => {
    // Owner can view
    if (isOwner(user, transaction, 'userId')) {
      return true;
    }

    // Admin can view all
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    return false;
  },

  canEdit: (user, transaction) => {
    // Owner can edit
    if (isOwner(user, transaction, 'userId')) {
      return { canEdit: true };
    }

    // Admin can edit
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return { canEdit: true };
    }

    return { canEdit: false, reason: 'Insufficient permissions' };
  },

  canDelete: (user, transaction) => {
    // Owner can delete
    if (isOwner(user, transaction, 'userId')) {
      return true;
    }

    // Admin can delete
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    // Members can create their own transactions
    return canCreate(user, {
      allowMember: true,
      allowAdmin: true
    });
  },

  canApprove: (user, transaction) => {
    // Only admin can approve
    return hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN;
  }
};

/**
 * FreelancerAccount Permission Helpers
 */
export const freelancerAccountPermissions = {
  canView: (user, account) => {
    // Owner can view (but secrets masked)
    if (isOwner(user, account, 'ownerUserId')) {
      return true;
    }

    // Admin can view all
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Check access scope
    if (account.accessScope && account.accessScope.allowedUserIds) {
      const allowedIds = Array.isArray(account.accessScope.allowedUserIds)
        ? account.accessScope.allowedUserIds
        : [account.accessScope.allowedUserIds];
      
      if (allowedIds.some(id => id.toString() === user._id.toString())) {
        return true;
      }
    }

    return false;
  },

  canEdit: (user, account) => {
    // Owner can edit
    if (isOwner(user, account, 'ownerUserId')) {
      return { canEdit: true };
    }

    // Admin can edit
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return { canEdit: true };
    }

    return { canEdit: false, reason: 'Insufficient permissions' };
  },

  canDelete: (user, account) => {
    // Owner can delete
    if (isOwner(user, account, 'ownerUserId')) {
      return true;
    }

    // Admin can delete
    if (hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    // Members can create their own accounts
    return canCreate(user, {
      allowMember: true,
      allowAdmin: true
    });
  },

  canRevealPassword: (user, account) => {
    // Only admin can reveal passwords
    return hasAdminPrivileges(user) || user.role === ROLES.SUPER_ADMIN;
  }
};

/**
 * PersonalProfile Permission Helpers
 */
export const personalProfilePermissions = {
  canView: (user, profile) => {
    // SUPER_ADMIN can view any profile
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Owner can view
    if (isOwner(user, profile, 'ownerUserId')) {
      return true;
    }

    return false;
  },

  canEdit: (user, profile) => {
    // SUPER_ADMIN can edit any profile
    if (user.role === ROLES.SUPER_ADMIN) {
      return { canEdit: true };
    }

    // Owner can edit
    if (isOwner(user, profile, 'ownerUserId')) {
      return { canEdit: true };
    }

    return { canEdit: false, reason: 'Insufficient permissions' };
  },

  canDelete: (user, profile) => {
    // SUPER_ADMIN can delete any profile
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Owner can delete
    if (isOwner(user, profile, 'ownerUserId')) {
      return true;
    }

    return false;
  },

  canCreate: (user) => {
    // Anyone authenticated can create their own profile
    return true;
  }
};
