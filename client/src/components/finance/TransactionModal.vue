<template>
  <div class="modal-backdrop">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? 'Edit Transaction' : 'Create Transaction' }}</h3>
        <button @click="close" class="modal-close">×</button>
      </div>

      <form @submit.prevent="save" class="modal-body">
        <!-- User (only show when editing or if no selectedUserId) -->
        <div v-if="isEdit || !selectedUserId" class="form-group">
          <label>User *</label>
          <select v-model="form.userId" required ref="firstInput">
            <option value="">Select user</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.name || u.email }}
            </option>
          </select>
        </div>

        <!-- Type -->
        <div class="form-group">
          <label>Type *</label>
          <select v-model="form.type" required ref="typeInput">
            <option value="income">Income</option>
            <option value="outcome">Outcome</option>
          </select>
        </div>

        <!-- Status -->
        <div class="form-group">
          <label>Status *</label>
          <select v-model="form.status" required>
            <option value="accepted">Accepted</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label>Amount *</label>
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>

        <!-- Source (for income) -->
        <div v-if="form.type === 'income'" class="form-group">
          <label>Source *</label>
          <input v-model="form.source" required placeholder="e.g., Client ABC" />
        </div>

        <!-- Category (for outcome) -->
        <div v-if="form.type === 'outcome'" class="form-group">
          <label>Category *</label>
          <input v-model="form.category" required placeholder="e.g., Office Supplies" />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label>Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Optional description..."
          />
        </div>

        <!-- Date -->
        <div class="form-group">
          <label>Date *</label>
          <DateSelector
            v-model="form.date"
          />
        </div>

        <!-- Currency -->
        <div class="form-group">
          <label>Currency</label>
          <select v-model="form.currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
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
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useFinance } from '../../composables/useFinance';
import { fetchUsers } from '../../services/users';
import { formatDateISO } from '../../utils/financeHelpers';
import DateSelector from './DateSelector.vue';

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  },
  selectedUserId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['saved', 'close']);

const { addTransaction, editTransaction } = useFinance();

const users = ref([]);
const saving = ref(false);

const isEdit = computed(() => !!props.transaction);

const form = ref({
  userId: '',
  type: 'income',
  status: 'accepted',
  amount: 0,
  source: '',
  category: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  currency: 'USD'
});

const typeInput = ref(null);

/* ======================
   LOAD USERS (SAME AS MONTHLY)
====================== */
const loadUsers = async () => {
  try {
    const res = await fetchUsers();
    users.value = res.users || [];

    // Default selection only if no selectedUserId prop
    if (!props.selectedUserId && !form.value.userId && users.value.length > 0) {
      const first = users.value[0];
      form.value.userId = first.id || first._id || '';
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
};

/* ======================
   EDIT MODE INIT
====================== */
watch(
  () => props.transaction,
  (t) => {
    if (t) {
      form.value = {
        userId: typeof t.userId === 'object' ? t.userId.id : t.userId,
        type: t.type || 'income',
        status: t.status || 'accepted',
        amount: t.amount || 0,
        source: t.source || '',
        category: t.category || '',
        description: t.description || '',
        date: new Date(t.date).toISOString().slice(0, 10),
        currency: t.currency || 'USD'
      };
    } else {
      // Reset form for create mode
      form.value = {
        userId: props.selectedUserId || '',
        type: 'income',
        status: 'accepted',
        amount: 0,
        source: '',
        category: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        currency: 'USD'
      };
    }
  },
  { immediate: true }
);

/* ======================
   SAVE
====================== */
const save = async () => {
  // Use selectedUserId if provided, otherwise use formData.userId
  const userId = props.selectedUserId || form.value.userId;
  
  if (!userId) {
    alert('Please select a user');
    return;
  }

  if (form.value.type === 'income' && !form.value.source) {
    alert('Source is required for income');
    return;
  }

  if (form.value.type === 'outcome' && !form.value.category) {
    alert('Category is required for expense');
    return;
  }

  saving.value = true;

  try {
    const userId = props.selectedUserId || form.value.userId;
    const payload = {
      userId: userId,
      type: form.value.type,
      status: form.value.status,
      amount: Number(form.value.amount),
      currency: form.value.currency,
      description: form.value.description || '',
      date: formatDateISO(new Date(form.value.date))
    };

    if (form.value.type === 'income') {
      payload.source = form.value.source;
    } else {
      payload.category = form.value.category;
    }

    if (isEdit.value) {
      await editTransaction(props.transaction._id, payload);
    } else {
      await addTransaction(payload);
    }

    emit('saved');
  } catch (err) {
    alert(
      err?.response?.data?.message ||
      err?.message ||
      'Save failed'
    );
  } finally {
    saving.value = false;
  }
};

const close = () => emit('close');

const firstInput = ref(null);

// Sync form when selectedUserId changes (for create mode)
watch(
  () => props.selectedUserId,
  (userId) => {
    if (!isEdit.value && userId) {
      form.value.userId = userId;
    }
  },
  { immediate: true }
);

// Focus first input when modal opens
watch(() => props.transaction, async () => {
  await nextTick();
  // Focus user field if visible, otherwise focus type field
  const inputToFocus = firstInput.value || typeInput.value;
  if (inputToFocus) {
    inputToFocus.focus();
  }
}, { immediate: true });

onMounted(() => {
  loadUsers();
  nextTick(() => {
    const inputToFocus = firstInput.value || typeInput.value;
    if (inputToFocus) {
      inputToFocus.focus();
    }
  });
});
</script>

<style scoped>
.modal-backdrop {
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

.modal {
  background: var(--bg-primary);
  border-radius: 8px;
  width: 520px;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
}

@media (max-width: 560px) {
  .modal {
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
  background: var(--bg-primary);
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
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
  font-family: inherit;
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
