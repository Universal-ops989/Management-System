<template>
  <tr class="table-row-clickable" @click="$emit('view', profile)">
    <td>{{ formatGroupLabel(profile.group) }}</td>
    <td>
      <div class="name-cell">
        <div v-if="profile.pictureFileId">
          <img :src="getPictureUrl(profile.pictureFileId._id || profile.pictureFileId)" alt="Profile"
            class="table-avatar" />
        </div>
        <span v-else class="table-avatar-placeholder">👤</span>
        <span>{{ profile.name }}</span>
      </div>
    </td>
    <td>{{ profile.country || 'N/A' }}</td>
    <td>
      <div class="contact-cell">
        <div v-if="profile.email">{{ displayEmail(profile) }}</div>
        <div v-if="profile.phone">{{ displayPhone(profile) }}</div>
        <div v-if="!profile.email && !profile.phone" class="text-muted">N/A</div>
      </div>
    </td>
    <td>
      <div class="tags-cell">
        <span v-for="tag in (profile.tags || []).slice(0, 2)" :key="tag" class="tag-small">
          {{ tag }}
        </span>
        <span v-if="profile.tags && profile.tags.length > 2" class="tag-more">
          +{{ profile.tags.length - 2 }}
        </span>
      </div>
    </td>
    <td>
      <span class="status-badge" :class="`status-${profile.status}`">
        {{ profile.status }}
      </span>
    </td>
    <td>{{ formatDate(profile.createdAt) }}</td>
    <td @click.stop>
      <div class="action-buttons">
        <button @click.stop="$emit('view', profile)" class="btn-view">View</button>
        <button v-if="canEdit" @click.stop="$emit('edit', profile)" class="btn-edit">
          Edit
        </button>
        <button v-if="canDelete" @click.stop="$emit('delete', profile)" class="btn-delete">
          Delete
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../composables/useAuth';
import {
  canEditFreelancerProfile,
  canDeleteFreelancerProfile
} from '../../utils/profilePermissions';
import { formatGroupLabel } from '../../constants/groups.js';

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view', 'edit', 'delete']);

const authStore = useAuthStore();

const canEdit = computed(() => {
  return canEditFreelancerProfile(authStore.user, props.profile);
});

const canDelete = computed(() => {
  return canDeleteFreelancerProfile(authStore.user, props.profile);
});

const getPictureUrl = (fileId) => {
  if (!fileId) return '';
  return `/api/files/${fileId}/download`;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const displayEmail = (profile) => {
  if (!profile.email) return '';
  return profile.email;
};

const displayPhone = (profile) => {
  if (!profile.phone) return '';
  return profile.phone;
};
</script>

<style scoped>
.table-row-clickable {
  border: 1px solid #dee2e6;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
}

.table-row-clickable:hover {
  background: #babdc0;
}

td {
  padding: 10px;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-avatar,
.table-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.text-muted {
  color: #7f8c8d;
  font-style: italic;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-small {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.tag-more {
  color: #7f8c8d;
  font-size: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: #2ecc71;
  color: white;
}

.status-archived {
  background: #95a5a6;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-edit {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-view:hover,
.btn-edit:hover {
  background: #2980b9;
}

.btn-delete {
  padding: 6px 12px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #c0392b;
}
</style>
