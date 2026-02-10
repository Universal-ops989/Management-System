<template>
  <div class="admin-users-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>User Management</h1>
          <p class="subtitle">Manage team members and permissions</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          + Add User
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadUsers" class="btn-retry">Retry</button>
    </div>

    <!-- Users Table -->
    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Group</th>
            <th>Degree</th>
            <th>Role</th>
            <th>Status</th>
            <th>Editor</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ formatGroupLabel(user.group) }}</td>
            <td>{{user.degree.replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, c => c.toUpperCase())}}</td>
            <td>
              <span class="role-badge" :class="`role-${user.role.toLowerCase()}`">
                {{ formatRole(user.role) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="`status-${user.status}`">
                {{ user.status }}
              </span>
            </td>
            <td>
              <span v-if="user.editor" class="badge-yes">Yes</span>
              <span v-else class="badge-no">No</span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="openEditModal(user)" class="btn-edit">Edit</button>
                <button @click="handleResetPassword(user)" class="btn-reset">Reset Password</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="7" class="empty-state">
              No users found. Click "Add User" to create one.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edit User' : 'Create User' }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Email *</label>
              <input v-model="form.email" type="email" required :disabled="editingUser !== null"
                placeholder="user@example.com" />
            </div>
            <div class="form-group">
              <label>Name *</label>
              <input v-model="form.name" type="text" required placeholder="Full Name" />
            </div>
            <!-- add group and member degree -->
            <div class="form-row">
              <div class="form-group">
                <label>Group *</label>
                <select v-model="form.group" required>
                  <option v-for="opt in userGroupOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Degree *</label>
                <select v-model="form.degree" required>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEAM_BOSS">Team Boss</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Role *</label>
                <select v-model="form.role" required>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="GUEST">Guest</option>
                  <option value="BOSS">Boss</option>
                  <option v-if="isSuperAdmin" value="SUPER_ADMIN">Super Admin</option>
                  <!-- Legacy BOSS option removed - will be auto-converted to ADMIN if used -->
                </select>
              </div>
              <div class="form-group">
                <label>Status *</label>
                <select v-model="form.status" required>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>
                <input v-model="form.editor" type="checkbox" />
                Editor (Can edit profiles and tickets)
              </label>
            </div>
            <div v-if="tempPassword" class="temp-password-alert">
              <strong>Temporary Password:</strong> {{ tempPassword }}
              <br />
              <small>Save this password! The user needs it to log in the first time.</small>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-save">
                {{ saving ? 'Saving...' : (editingUser ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import * as adminService from '../services/admin';
import { USER_GROUP_OPTIONS, formatGroupLabel, DEFAULT_USER_GROUP } from '../constants/groups.js';

const authStore = useAuthStore();
const userGroupOptions = USER_GROUP_OPTIONS;

const loading = ref(false);
const error = ref(null);
const users = ref([]);
const showModal = ref(false);
const editingUser = ref(null);
const saving = ref(false);
const tempPassword = ref('');

import { ROLES } from '../constants/roles.js';

const isSuperAdmin = computed(() => authStore.user?.role === ROLES.SUPER_ADMIN);

const form = ref({
  email: '',
  name: '',
  group: DEFAULT_USER_GROUP,
  member: 'MEMBER',
  role: 'MEMBER',
  status: 'active',
  editor: false
});

const loadUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminService.fetchUsers({ limit: 1000 });
    if (response.ok && response.data) {
      users.value = response.data.users || [];
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load users';
    console.error('Error loading users:', err);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingUser.value = null;
  form.value = {
    email: '',
    name: '',
    group: DEFAULT_USER_GROUP,
    degree: 'MEMBER',
    role: 'MEMBER',
    status: 'active',
    editor: false
  };
  tempPassword.value = '';
  showModal.value = true;
};

const openEditModal = (user) => {
  editingUser.value = user;
  form.value = {
    email: user.email,
    name: user.name,
    group: user.group,
    degree: user.degree,
    role: user.role,
    status: user.status,
    editor: user.editor || false
  };
  tempPassword.value = '';
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingUser.value = null;
  tempPassword.value = '';
};

const handleSubmit = async () => {
  saving.value = true;
  error.value = null;
  try {
    if (editingUser.value) {
      // Update user
      const response = await adminService.updateUser(editingUser.value.id, {
        group: form.value?.group,
        degree: form.value?.degree,
        role: form.value.role,
        status: form.value.status,
        editor: form.value.editor
      });
      if (response.ok) {
        await loadUsers();
        closeModal();
      }
    } else {
      // Create user
      const response = await adminService.createUser(form.value);
      if (response.ok && response.data) {
        tempPassword.value = response.data.tempPassword || '';
        await loadUsers();
        // Don't close modal yet - show temp password
        setTimeout(() => {
          closeModal();
        }, 5000); // Auto-close after 5 seconds
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save user';
    console.error('Error saving user:', err);
  } finally {
    saving.value = false;
  }
};

const handleResetPassword = async (user) => {
  if (!confirm(`Reset password for ${user.name}? A new temporary password will be generated.`)) {
    return;
  }
  try {
    const response = await adminService.resetUserPassword(user.id);
    if (response.ok && response.data) {
      const newPassword = response.data.tempPassword || '';
      alert(`Password reset successful!\n\nTemporary Password: ${newPassword}\n\nShare this with the user.`);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to reset password';
    alert(`Error: ${error.value}`);
  }
};

const formatRole = (role) => {
  return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.admin-users-view {
  background: transparent;
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-header h1 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: var(--font-size-sm);
}

.btn-primary {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.spinner {
  border: 3px solid var(--border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--spacing-lg);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.users-table-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

.users-table th {
  padding: var(--spacing-lg);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-light);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.users-table tbody tr {
  transition: all var(--transition-fast);
}

.users-table tbody tr:hover {
  background: var(--bg-tertiary);
  transform: scale(1.01);
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: capitalize;
}

.role-super_admin {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%);
  color: var(--color-secondary);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.role-boss,
.role-admin {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
  color: var(--color-info);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.role-member {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(75, 85, 99, 0.2) 100%);
  color: var(--color-gray-600);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-pending {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-disabled {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-yes {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.badge-no {
  color: var(--text-tertiary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn-edit,
.btn-reset {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.btn-edit {
  background: linear-gradient(135deg, var(--color-info) 0%, #2563eb 100%);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-reset {
  background: linear-gradient(135deg, var(--color-warning) 0%, #d97706 100%);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-reset:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  padding: var(--spacing-md);
  animation: fadeIn var(--transition-base);
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  width: 520px;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  animation: slideUp var(--transition-slow);
  border: 1px solid var(--border-light);
}

@media (max-width: 560px) {
  .modal {
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--spacing-xs);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-content {
  padding: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group select {
  width: 100%;
  padding: var(--spacing-md);
  border: 1.5px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.form-group input[type="checkbox"] {
  margin-right: var(--spacing-sm);
  width: auto;
  cursor: pointer;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.temp-password-alert {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  border: 1.5px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  color: #92400e;
}

.temp-password-alert strong {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.btn-cancel,
.btn-save {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1.5px solid var(--border-medium);
}

.btn-cancel:hover {
  background: var(--border-medium);
}

.btn-save {
  background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-retry {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  margin-top: var(--spacing-lg);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.btn-retry:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .page-header {
    padding: var(--spacing-lg);
  }

  .page-header h1 {
    font-size: var(--font-size-2xl);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .users-table {
    font-size: var(--font-size-xs);
  }

  .users-table th,
  .users-table td {
    padding: var(--spacing-md);
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-edit,
  .btn-reset {
    width: 100%;
  }
}
</style>
