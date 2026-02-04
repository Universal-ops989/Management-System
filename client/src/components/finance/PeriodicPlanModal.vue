<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Week Plan' : 'Create Week Plan' }}</h2>
        <button @click="close" class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="save">
          <div class="form-group">
            <label>User *</label>
            <select v-model="formData.userId" required :disabled="isEditing" ref="firstInput">
              <option value="">Select User</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name || user.email }}
              </option>
            </select>
          </div>
          <!-- <div class="form-group">
            <label>Week*</label>
            <input type="text" v-model="formData.definition" placeholder="Optional note..." required />
          </div> -->
          <div class="form-group">
            <label>Period *</label>
            <select v-model="formData.periodId" required :disabled="isEditing">
              <option value="">Select Period</option>
              <option v-for="period in periods" :key="period._id" :value="period._id">
                {{ period.definition }}
                ({{ formatDate(period.startDate) }} – {{ formatDate(period.endDate) }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Target *</label>
            <input type="number" min="0" step="0.01" v-model.number="formData.periodicFinancialGoal" required />
          </div>
          <div class="form-group">
            <label>Note</label>
            <textarea v-model="formData.note" rows="3" placeholder="Optional note..." />
          </div>
          <div class="form-actions">
            <button type="button" @click="close" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { fetchUsers } from '../../services/users';
import { formatDate } from '../../utils/financeHelpers';
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  plan: {
    type: Object,
    default: null
  },
  periods: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['close', 'saved']);

const { addPeriodicPlan, editPeriodicPlan, loading } = useFinance();
const users = ref([]);
const saving = ref(false);

const isEditing = computed(() => !!props.plan?._id);

const formData = ref({
  userId: '',
  periodId: '',
  periodicFinancialGoal: 0,
  note: ''
});

const close = () => {
  emit('close');
};

const save = async () => {
  if (saving.value) return;

  if (!formData.value.periodId) {
    alert('Period is required');
    return;
  }

  saving.value = true;

  try {
    const payload = {
      userId: formData.value.userId,
      periodId: formData.value.periodId,
      periodicFinancialGoal: Number(formData.value.periodicFinancialGoal),
      note: formData.value.note
    };

    if (isEditing.value) {
      await editPeriodicPlan(props.plan._id, payload);
    } else {
      await addPeriodicPlan(payload);
    }

    emit('saved');
    close();
  } catch (err) {
    console.error('Failed to save periodic plan', err);
    alert(
      err?.response?.data?.message ||
      err?.message ||
      'Failed to save periodic plan'
    );
  } finally {
    saving.value = false;
  }
};

/* Load users */

const loadUsers = async () => {
  try {
    const response = await fetchUsers();
    if (response.ok && response.data) {
      users.value = response.data.users || [];
      console.log("USERSSSSSSSSSSSSSSSSSSSSSSSSS", users.value);
      if (!formData.value.userId && users.value.length > 0) {
        formData.value.userId = users.value[0]._id;
      }
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
};
function resetForm() {
  formData.value = {
    userId: '',
    periodId: '',
    periodicFinancialGoal: 0,
    note: ''
  };
};
/* Sync form when plan changes */
watch(
  () => props.plan,
  (plan) => {
    if (plan) {
      formData.value = {
        userId: typeof plan.userId === 'object' ? plan.userId._id : plan.userId,
        periodId: plan.periodId?._id || plan.periodId,
        periodicFinancialGoal: plan.periodicFinancialGoal,
        note: plan.note || ''
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);
const firstInput = ref(null);

// Focus first input when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    if (firstInput.value) {
      firstInput.value.focus();
    }
  }
});

onMounted(() => {
  console.log("SDGGGGGGGGGG",props)
  loadUsers();
  if (props.isOpen) {
    nextTick(() => {
      if (firstInput.value) {
        firstInput.value.focus();
      }
    });
  }
  // if (props.plan) {
  //   formData.value = {
  //     userId: props.plan.userId,
  //     month: props.plan.month,
  //     startDate: props.plan.startDate?.slice(0, 10),
  //     endDate: props.plan.endDate?.slice(0, 10),
  //     definition: props.plan.definition,
  //     periodicFinancialGoal: props.plan.periodicFinancialGoal,
  //     note: props.plan.note || ''
  //   };
  // }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 8px;
  width: 480px;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
}

@media (max-width: 520px) {
  .modal-content {
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.btn-primary {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}
</style>
