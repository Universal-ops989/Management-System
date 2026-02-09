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
        <FreelancerProfileRow
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
import { canCreateFreelancerProfile } from '../../utils/profilePermissions';
import FreelancerProfileRow from './FreelancerProfileRow.vue';

const props = defineProps({
  profiles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'create']);

const authStore = useAuthStore();

const canCreate = computed(() => {
  return canCreateFreelancerProfile(authStore.user);
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
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.profiles-table {
  width: 100%;
  border-collapse: collapse;
}

.profiles-table thead {
  background: var(--bg-tertiary);
}

.profiles-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-light);
}

.profiles-table tbody tr {
  border-bottom: 1px solid var(--border-light);
}

.profiles-table tbody tr:last-child {
  border-bottom: none;
}

.profiles-table td {
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 8px;
}

.btn-link:hover {
  color: #2980b9;
}
</style>
