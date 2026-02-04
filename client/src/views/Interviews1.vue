<template>
  <div class="interviews-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Interviews Management</h1>
          <p class="subtitle">Schedule and manage candidate interviews</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          + Create Interview
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading interviews...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadInterviews" class="btn-retry">Retry</button>
    </div>

    <!-- Interviews Table -->
    <div v-else class="interviews-table-container">
      <table class="interviews-table">
        <thead>
          <tr>
            <th>Job Ticket</th>
            <th>Scheduled At</th>
            <th>Duration</th>
            <th>Type</th>
            <th>Platform</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="interview in interviews" :key="interview._id || interview.id">
            <td>{{ interview.jobTicketId?.title || 'N/A' }}</td>
            <td>{{ formatDateTime(interview.scheduledAt) }}</td>
            <td>{{ interview.durationMinutes }} min</td>
            <td>{{ interview.interviewType || 'N/A' }}</td>
            <td>{{ interview.platform || 'N/A' }}</td>
            <td>{{ interview.createdByUserId?.name || interview.createdByUserId?.email || 'N/A' }}</td>
            <td>
              <button @click="openEditModal(interview)" class="btn-edit">Edit</button>
            </td>
          </tr>
          <tr v-if="interviews.length === 0">
            <td colspan="7" class="empty-state">
              No interviews found. Click "Create Interview" to add one.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingInterview ? 'Edit Interview' : 'Create Interview' }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Job Ticket *</label>
              <select v-model="form.jobTicketId" required>
                <option value="">Select a job ticket...</option>
                <option v-for="ticket in jobTickets" :key="ticket._id || ticket.id" :value="ticket._id || ticket.id">
                  {{ ticket.title }}
                </option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Scheduled At *</label>
                <input
                  v-model="form.scheduledAt"
                  type="datetime-local"
                  required
                />
              </div>
              <div class="form-group">
                <label>Duration (minutes) *</label>
                <input
                  v-model.number="form.durationMinutes"
                  type="number"
                  min="1"
                  required
                  placeholder="60"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Interview Type</label>
                <input v-model="form.interviewType" type="text" placeholder="e.g., Technical, HR, Final" />
              </div>
              <div class="form-group">
                <label>Platform</label>
                <input v-model="form.platform" type="text" placeholder="e.g., Zoom, Google Meet" />
              </div>
            </div>
            <div class="form-group">
              <label>Meeting Link</label>
              <input v-model="form.meetingLink" type="url" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Participants</label>
              <input v-model="form.participants" type="text" placeholder="Interview participants" />
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" rows="4" placeholder="Interview notes..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-save">
                {{ saving ? 'Saving...' : (editingInterview ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as interviewService from '../services/interviews';
import * as jobTicketService from '../services/jobTickets';

const loading = ref(false);
const error = ref(null);
const interviews = ref([]);
const jobTickets = ref([]);
const showModal = ref(false);
const editingInterview = ref(null);
const saving = ref(false);

const form = ref({
  jobTicketId: '',
  scheduledAt: '',
  durationMinutes: 60,
  interviewType: '',
  platform: '',
  meetingLink: '',
  participants: '',
  notes: ''
});

const loadJobTickets = async () => {
  try {
    const response = await jobTicketService.fetchJobTickets({ limit: 1000, status: 'open' });
    if (response.ok && response.data) {
      jobTickets.value = response.data.tickets || [];
    }
  } catch (err) {
    console.error('Failed to load job tickets:', err);
  }
};

const loadInterviews = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await interviewService.fetchInterviews({ limit: 1000 });
    if (response.ok && response.data) {
      interviews.value = response.data.interviews || [];
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load interviews';
    console.error('Error loading interviews:', err);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingInterview.value = null;
  form.value = {
    jobTicketId: '',
    scheduledAt: '',
    durationMinutes: 60,
    interviewType: '',
    platform: '',
    meetingLink: '',
    participants: '',
    notes: ''
  };
  showModal.value = true;
};

const openEditModal = (interview) => {
  editingInterview.value = interview;
  const scheduledDate = interview.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : '';
  form.value = {
    jobTicketId: interview.jobTicketId?._id || interview.jobTicketId || '',
    scheduledAt: scheduledDate,
    durationMinutes: interview.durationMinutes || 60,
    interviewType: interview.interviewType || '',
    platform: interview.platform || '',
    meetingLink: interview.meetingLink || '',
    participants: interview.participants || '',
    notes: interview.notes || ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingInterview.value = null;
};

const handleSubmit = async () => {
  saving.value = true;
  error.value = null;
  try {
    const interviewData = {
      ...form.value,
      scheduledAt: new Date(form.value.scheduledAt).toISOString()
    };

    if (editingInterview.value) {
      const response = await interviewService.updateInterview(
        editingInterview.value._id || editingInterview.value.id,
        interviewData
      );
      if (response.ok) {
        await loadInterviews();
        closeModal();
      }
    } else {
      const response = await interviewService.createInterview(interviewData);
      if (response.ok) {
        await loadInterviews();
        closeModal();
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save interview';
    console.error('Error saving interview:', err);
  } finally {
    saving.value = false;
  }
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

onMounted(async () => {
  await loadJobTickets();
  await loadInterviews();
});
</script>

<style scoped>
.interviews-view {
  background: transparent;
  padding: 0;
}

.page-header {
  background: var(--bg-primary);
  padding: 20px 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  color: var(--text-primary);
  margin: 0 0 4px 0;
  font-size: 1.8rem;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.spinner {
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid var(--color-info);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.interviews-table-container {
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.interviews-table {
  width: 100%;
  border-collapse: collapse;
}

.interviews-table thead {
  background: var(--bg-tertiary);
}

.interviews-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-light);
}

.interviews-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

.interviews-table tbody tr:hover {
  background: var(--bg-tertiary);
}

.btn-edit {
  padding: 6px 12px;
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.btn-edit:hover {
  background: var(--color-primary-dark);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
}

/* Modal Styles - Same as Profiles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--bg-tertiary);
}

.modal-content {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-cancel {
  background: var(--text-tertiary);
  color: var(--text-inverse);
}

.btn-cancel:hover {
  background: var(--text-secondary);
}

.btn-save {
  background: var(--color-success);
  color: var(--text-inverse);
}

.btn-save:hover:not(:disabled) {
  background: var(--color-success-dark);
}

.btn-save:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.btn-retry {
  padding: 10px 20px;
  background: var(--color-info);
  color: var(--text-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
}
</style>



///////////////////////////////////////////////////////////
<script setup>
import { ref, watch, computed } from 'vue'
import apiClient from '../services/axios'

/* ===============================
   STATE
================================ */

const selectedMonth = ref('2026-01') // YYYY-MM
const selectedMemberId = ref('all')  // 'all' or userId

const loading = ref(false)
const error = ref(null)
const metrics = ref(null)

/* ===============================
   HELPERS
================================ */

const getMonthRange = (month) => {
  const start = new Date(`${month}-01`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/* ===============================
   API
================================ */

const loadFinanceOverview = async () => {
  loading.value = true
  error.value = null

  try {
    const { start, end } = getMonthRange(selectedMonth.value)

    const res = await apiClient.get('finance/finance-overview', {
      params: {
        start,
        end,
        memberId: selectedMemberId.value
      }
    })

    metrics.value = res.data.data.metrics
  } catch (err) {
    console.error(err)
    error.value = err
  } finally {
    loading.value = false
  }
}

/* ===============================
   WATCHERS
================================ */

watch(selectedMonth, loadFinanceOverview, { immediate: true })

/* ===============================
   SAFE COMPUTEDS
================================ */

const yearMetrics = computed(() => metrics.value?.year ?? null)
const monthMetrics = computed(() => metrics.value?.month ?? null)
const weekMetrics = computed(() => metrics.value?.week ?? [])
</script>

<template>
  <div class="finance-overview">

    <!-- HEADER -->
    <div class="header">
      <h1>Finance Overview</h1>

      <div class="filters">
        <label>
          Month:
          <input type="month" v-model="selectedMonth" />
        </label>
      </div>
    </div>

    <!-- STATES -->
    <div v-if="loading">Loading finance overview…</div>
    <div v-if="error" class="error">Failed to load data</div>

    <!-- RAW DEBUG VIEW -->
    <section v-if="metrics" class="debug">
      <h2>RAW METRICS (Debug)</h2>
      <pre>{{ metrics }}</pre>
    </section>

    <!-- YEAR -->
    <section v-if="yearMetrics">
      <h2>Year Summary</h2>

      <pre>{{ yearMetrics }}</pre>

      <h3>By User</h3>
      <ul>
        <li v-for="u in yearMetrics.byUser" :key="u.user._id">
          {{ u.user.name || u.user.email }} —
          Target: {{ u.target }},
          ActualIncome: {{ u.actualIncome }},
          ActualOutcome: {{ u.actualExpense }},
          Gap: {{ u.gap }}
        </li>
      </ul>
    </section>

    <!-- MONTH -->
    <section v-if="monthMetrics">
      <h2>Month Summary</h2>

      <pre>{{ monthMetrics }}</pre>

      <h3>By User</h3>
      <ul>
        <li v-for="u in monthMetrics.byUser" :key="u.user._id">
          {{ u.user.name || u.user.email }} —
          Target: {{ u.target }},
          ActualIncome: {{ u.actualIncome }},
          ActualOutcome: {{ u.actualExpense }},
          Pending: {{ u.pendingIncome }},
          Gap: {{ u.gap }}
        </li>
      </ul>
    </section>

    <!-- WEEK -->
    <section v-if="weekMetrics.length">
      <h2>Weekly Breakdown</h2>

      <div
        v-for="week in weekMetrics"
        :key="week.period"
        class="week-block"
      >
        <h3>{{ week.period }}</h3>

        <strong>Total</strong>
        <pre>{{ week.total }}</pre>

        <strong>By User</strong>
        <ul>
          <li v-for="u in week.byUser" :key="u.user._id">
            {{ u.user.name || u.user.email }} —
            Target: {{ u.target }},
            ActualIncome: {{ u.actualIncome }},
            ActualOutcome: {{ u.actualOutcome }},
            Gap: {{ u.gap }}
          </li>
        </ul>
      </div>
    </section>

  </div>
</template>

<style scoped>
.finance-overview {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters label {
  font-weight: 600;
}

.debug {
  background: var(--bg-tertiary);
  padding: 12px;
  margin: 16px 0;
  border-radius: 6px;
}

.week-block {
  border: 1px solid #ddd;
  padding: 12px;
  margin-bottom: 12px;
}
</style>
<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import apiClient from '../services/axios'
/* ===============================
   STATE
================================ */

const selectedMonth = ref('2026-01')
const selectedMemberId = ref('all')
const selectedPeriod = ref('all') // 'all' or period.definition

const loading = ref(false)
const error = ref(null)
const metrics = ref(null)
const users = ref([])

/* ===============================
   HELPERS
================================ */

const getMonthRange = (month) => {
  const start = new Date(`${month}-01`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/* ===============================
   API
================================ */

const loadUsers = async () => {
  const res = await apiClient.get('admin/users')
  console.log(res.data.data.users);
  users.value = res.data.data.users || []
  console.log(users.value);
}

const loadFinanceOverview = async () => {
  loading.value = true
  error.value = null

  try {
    const { start, end } = getMonthRange(selectedMonth.value)

    const res = await apiClient.get('finance/finance-overview', {
      params: {
        start,
        end,
        memberId: selectedMemberId.value
      }
    })

    metrics.value = res.data.data.metrics
    selectedPeriod.value = 'all' // reset on reload
  } catch (err) {
    console.error(err)
    error.value = err
  } finally {
    loading.value = false
  }
}

/* ===============================
   LIFECYCLE
================================ */

onMounted(loadUsers)

watch(
  [selectedMonth, selectedMemberId],
  loadFinanceOverview,
  { immediate: true }
)

/* ===============================
   COMPUTEDS
================================ */

const availablePeriods = computed(() =>
  metrics.value?.week ?? []
)

const selectedWeek = computed(() => {
  if (selectedPeriod.value === 'all') return null
  return availablePeriods.value.find(
    p => p.period === selectedPeriod.value
  )
})
</script>

<template>
  <div class="finance-overview">

    <!-- HEADER -->
    <div class="header">
      <h1>Finance Overview</h1>

      <div class="filters">

        <!-- MONTH -->
        <label>
          Month:
          <input type="month" v-model="selectedMonth" />
        </label>

        <!-- USER -->
        <label>
          User:
          <select v-model="selectedMemberId">
            <option value="all">All Users</option>
            <option
              v-for="u in users"
              :key="u._id"
              :value="u._id"
            >
              {{ u.name || u.email }}
            </option>
          </select>
        </label>

        <!-- PERIOD (WEEK) -->
        <label v-if="availablePeriods.length">
          Period:
          <select v-model="selectedPeriod">
            <option value="all">All Periods</option>
            <option
              v-for="p in availablePeriods"
              :key="p.period"
              :value="p.period"
            >
              {{ p.period }}
            </option>
          </select>
        </label>

      </div>
    </div>

    <!-- STATES -->
    <div v-if="loading">Loading finance overview…</div>
    <div v-if="error" class="error">Failed to load finance data</div>

    <!-- YEAR -->
    <section v-if="metrics && !selectedWeek">
      <h2>Year Summary</h2>
      <pre>{{ metrics.year.total }}</pre>
    </section>

    <!-- MONTH -->
    <section v-if="metrics && !selectedWeek">
      <h2>Month Summary</h2>
      <pre>{{ metrics.month.total }}</pre>
    </section>

    <!-- ALL WEEKS -->
    <section v-if="metrics && !selectedWeek">
      <h2>Weekly Breakdown</h2>

      <div
        v-for="week in metrics.week"
        :key="week.period"
        class="week-block"
      >
        <h3>{{ week.period }}</h3>
        <pre>{{ week.total }}</pre>
      </div>
    </section>

    <!-- SINGLE WEEK -->
    <section v-if="selectedWeek">
      <h2>Period: {{ selectedWeek.period }}</h2>

      <strong>Total</strong>
      <pre>{{ selectedWeek.total }}</pre>

      <strong>By User</strong>
      <ul>
        <li
          v-for="u in selectedWeek.byUser"
          :key="u.user._id"
        >
          {{ u.user.name || u.user.email }} —
          Target: {{ u.target }},
          Actual: {{ u.actualIncome }},
          Gap: {{ u.gap }}
        </li>
      </ul>
    </section>

  </div>
</template>

<style scoped>
.finance-overview {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 12px;
}

.week-block {
  border: 1px solid #ddd;
  padding: 12px;
  margin-bottom: 12px;
}
</style>
