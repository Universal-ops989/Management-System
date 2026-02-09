<template>
  <div class="profiles-table-container">
    <table class="profiles-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Name</th>
          <th>Country</th>
          <th>Contact</th>
          <th>Tags</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <ProfileRow
          v-for="profile in profiles"
          :key="profile._id || profile.id"
          :profile="profile"
          @view="handleView"
          @edit="handleEdit"
          @delete="handleDelete"
        />
        <tr v-if="profiles.length === 0">
          <td colspan="7" class="empty-state">
            No profiles found.
            <button v-if="canCreate" @click="$emit('create')" class="btn-link">
              Create one
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../composables/useAuth';
import { normalizeRole, ROLES } from '../../constants/roles.js';
import ProfileRow from './ProfileRow.vue';

const props = defineProps({
  profiles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'create']);

const authStore = useAuthStore();

const canCreate = computed(() => {
  if (!authStore.user) return false;
  const userRole = normalizeRole(authStore.user.role);
  return userRole === ROLES.SUPER_ADMIN || 
         userRole === ROLES.ADMIN || 
         authStore.user.editor === true;
});

const handleView = (profile) => {
  emit('view', profile);
};

const handleEdit = (profile) => {
  emit('edit', profile);
};

const handleDelete = (profile) => {
  emit('delete', profile);
};
</script>

<style scoped>
.profiles-table-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.profiles-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.profiles-table thead {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

.profiles-table th {
  padding: var(--spacing-lg);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-light);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profiles-table td {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.profiles-table tbody tr {
  transition: all var(--transition-fast);
}

.profiles-table tbody tr:hover {
  background: var(--bg-tertiary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-size: inherit;
  font-weight: var(--font-weight-semibold);
  transition: color var(--transition-fast);
  margin-left: var(--spacing-xs);
}

.btn-link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .profiles-table {
    font-size: var(--font-size-xs);
  }
  
  .profiles-table th,
  .profiles-table td {
    padding: var(--spacing-md);
  }
}
</style>
