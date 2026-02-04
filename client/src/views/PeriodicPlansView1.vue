<template>
  <div class="periodic-plans-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Periodic Financial Plans</h1>
          <p class="subtitle">View periodic financial goals broken down by date ranges</p>
        </div>
        <button
          v-if="isBoss"
          @click="openCreateModal"
          class="btn-primary"
        >
          + Create Periodic Plan
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Month:</label>
        <input
          v-model="selectedMonth"
          type="month"
          @change="loadData"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <label>User:</label>
        <select
          v-model="selectedUserId"
          @change="loadData"
          class="filter-select"
        >
          <option value="">All Users</option>
          <option v-for="user in allUsers" :key="user.id" :value="user.id">
            {{ user.name || user.email }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading periodic plans...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="periodic-plans-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Period</th>
            <th>Date Range</th>
            <th>Target</th>
            <th>Actual</th>
            <th>Pending</th>
            <th>Gap</th>
            <th v-if="isBoss">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="plan in filteredPlans"
            :key="plan._id"
            @click="openPeriodDrawer(plan)"
            class="table-row-clickable"
          >
            <td>{{ getUserName(plan.userId) }}</td>
            <td>{{ getPeriodName(plan) }}</td>
            <td>{{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}</td>
            <td class="target-value">{{ formatCurrency(plan.periodicFinancialGoal, currency) }}</td>
            <td class="income-value">{{ formatCurrency(getPeriodActual(plan), currency) }}</td>
            <td class="pending-value">{{ formatCurrency(getPeriodPending(plan), currency) }}</td>
            <td :class="{ 'income-value': getPeriodGap(plan) >= 0, 'expense-value': getPeriodGap(plan) < 0 }">
              {{ formatCurrency(getPeriodGap(plan), currency) }}
            </td>
            <td v-if="isBoss" @click.stop class="actions-cell">
              <button
                @click.stop="openEditModal(plan)"
                class="btn-action btn-edit"
                title="Edit"
              >
                ✎
              </button>
            </td>
          </tr>
          <tr v-if="filteredPlans.length === 0">
            <td colspan="7" class="empty-state">No periodic plans found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Period Drawer -->
    <PeriodFinanceDrawer
      v-if="selectedPlan"
      :plan="selectedPlan"
      :read-only="!isBoss"
      @close="closePeriodDrawer"
    />

    <!-- Create Modal -->
    <PeriodicPlanModal
     :isOpen="showModal"
      :plan="editingPlan"
      @close="closeModal"
      @saved="handlePlanSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useAuthStore } from '../composables/useAuth';
import { fetchUsers } from '../services/users';
import { formatCurrency, formatDate, getCurrentMonth } from '../utils/financeHelpers';
import PeriodFinanceDrawer from '../components/finance/PeriodFinanceDrawer.vue';
import PeriodicPlanModal from '../components/finance/PeriodicPlanModal.vue';

const authStore = useAuthStore();
const isBoss = computed(() => {
  const role = authStore.user?.role;
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'BOSS';
});

const {
  periodicPlans,
  transactions,
  loading,
  error,
  loadPeriodicPlans,
  loadTransactions
} = useFinance();

const selectedMonth = ref(getCurrentMonth());
const selectedUserId = ref('');
const allUsers = ref([]);
const selectedPlan = ref(null);
const showModal = ref(false);
const editingPlan = ref(null);
const currency = ref('USD');

const filteredPlans = computed(() => {
  let plans = periodicPlans.value;

  if (selectedMonth.value) {
    plans = plans.filter(p => p.month === selectedMonth.value);
  }

  if (selectedUserId.value) {
    plans = plans.filter(p => {
      const userId = typeof p.userId === 'object' ? p.userId._id : p.userId;
      return userId === selectedUserId.value;
    });
  }

  return plans;
});

const getUserName = (userId) => {
  if (typeof userId === 'object' && userId !== null) {
    return userId.name || userId.email || 'Unknown';
  }
  const user = allUsers.value.find(u => u._id === userId);
  return user?.name || user?.email || 'Unknown User';
};

const getPeriodName = (plan) => {
  // Could be enhanced to show period index or name
  console.log("PLAN DEFINITION", plan)
  return plan.definition ? ` ${plan.definition}` : 'N/A';
  // return `${formatDate(plan.startDate, { day: 'numeric' })} - ${formatDate(plan.endDate, { day: 'numeric' })}`;
};

const getPeriodActual = (plan) => {
  // Calculate actual from transactions in date range
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  end.setHours(23, 59, 59, 999);

  return transactions.value
    .filter(t => {
      const txDate = new Date(t.date);
      const txUserId = typeof t.userId === 'object' ? t.userId._id : t.userId;
      const planUserId = typeof plan.userId === 'object' ? plan.userId._id : plan.userId;
      return txDate >= start && txDate <= end &&
             txUserId === planUserId &&
             t.status === 'accepted' &&
             t.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

const getPeriodPending = (plan) => {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  end.setHours(23, 59, 59, 999);

  return transactions.value
    .filter(t => {
      const txDate = new Date(t.date);
      const txUserId = typeof t.userId === 'object' ? t.userId._id : t.userId;
      const planUserId = typeof plan.userId === 'object' ? plan.userId._id : plan.userId;
      return txDate >= start && txDate <= end &&
             txUserId === planUserId &&
             t.status === 'pending' &&
             t.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

const getPeriodGap = (plan) => {
  const actual = getPeriodActual(plan);
  const pending = getPeriodPending(plan);
  const expense = 0; // Could calculate if needed
  return plan.periodicFinancialGoal - (actual + pending - expense);
};

const openCreateModal = () => {
    editingPlan.value = null;
  showModal.value = true;
};

const openEditModal = (plan) => {
  editingPlan.value = plan;
  showModal.value = true;
};

const openPeriodDrawer = (plan) => {
  selectedPlan.value = plan;
};

const closePeriodDrawer = () => {
  selectedPlan.value = null;
};

const closeModal = () => {
    editingPlan.value = null;
  showModal.value = false;
};

const handlePlanSaved = () => {
  closeModal();
  loadData();
};

const loadData = async () => {
  try {
    // Load users
    const usersResponse = await fetchUsers();
    if (usersResponse.ok && usersResponse.data) {
      allUsers.value = usersResponse.data.users || [];
    }

    // Load periodic plans
    const filters = {};
    if (selectedMonth.value) {
      filters.month = selectedMonth.value;
    }
    if (selectedUserId.value) {
      filters.userId = selectedUserId.value;
    }

    await loadPeriodicPlans(filters);

    // Load transactions for calculations
    if (selectedMonth.value) {
      const [year, month] = selectedMonth.value.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      await loadTransactions({
        from: startDate.toISOString(),
        to: endDate.toISOString()
      });
    }
  } catch (err) {
    console.error('Error loading periodic plans:', err);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
  .btn-action {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-action:hover {
  background: #f9fafb;
}

.btn-edit:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}
.periodic-plans-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #2563eb;
}

.filters-section {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 150px;
}

.table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.periodic-plans-table {
  width: 100%;
  border-collapse: collapse;
}

.periodic-plans-table thead {
  background: #f9fafb;
}

.periodic-plans-table th {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.periodic-plans-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.table-row-clickable {
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row-clickable:hover {
  background-color: #f9fafb;
}

.target-value {
  color: #6366f1;
  font-weight: 500;
}

.income-value {
  color: #10b981;
  font-weight: 500;
}

.expense-value {
  color: #ef4444;
  font-weight: 500;
}

.pending-value {
  color: #f59e0b;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 48px;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}
</style>

<!-- <template>
  <div class="periodic-plans-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Periodic Financial Plans</h1>
          <p class="subtitle">
            View periodic financial goals broken down by date ranges
          </p>
        </div>

        <div class="header-actions">
          <button
            v-if="isBoss"
            @click="openCreatePeriodModal"
            class="btn-primary"
          >
            + Create Period
          </button>

          <button
            v-if="isBoss"
            @click="openCreatePlanModal"
            class="btn-primary"
          >
            + Assign Goal
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Period:</label>
        <select
          v-model="selectedPeriodId"
          class="filter-select"
        >
          <option value="">All Periods</option>
          <option
            v-for="period in periods"
            :key="period._id"
            :value="period._id"
          >
            {{ period.definition }}
            ({{ formatDate(period.startDate) }} – {{ formatDate(period.endDate) }})
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>User:</label>
        <select
          v-model="selectedUserId"
          class="filter-select"
        >
          <option value="">All Users</option>
          <option
            v-for="user in allUsers"
            :key="user._id"
            :value="user._id"
          >
            {{ user.name || user.email }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading periodic plans...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Retry</button>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="periodic-plans-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Period</th>
            <th>Date Range</th>
            <th>Target</th>
            <th>Actual</th>
            <th>Pending</th>
            <th>Gap</th>
            <th v-if="isBoss">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="plan in filteredPlans"
            :key="plan._id"
            @click="openPeriodDrawer(plan)"
            class="table-row-clickable"
          >
            <td>{{ getUserName(plan.userId) }}</td>
            <td>{{ plan.periodId?.definition || '—' }}</td>
            <td>
              {{ formatDate(plan.periodId?.startDate) }}
              –
              {{ formatDate(plan.periodId?.endDate) }}
            </td>
            <td class="target-value">
              {{ formatCurrency(plan.periodicFinancialGoal, currency) }}
            </td>
            <td class="income-value">
              {{ formatCurrency(getPeriodActual(plan), currency) }}
            </td>
            <td class="pending-value">
              {{ formatCurrency(getPeriodPending(plan), currency) }}
            </td>
            <td :class="{ 'income-value': getPeriodGap(plan) >= 0, 'expense-value': getPeriodGap(plan) < 0 }">
              {{ formatCurrency(getPeriodGap(plan), currency) }}
            </td>
            <td v-if="isBoss" @click.stop>
              <button
                @click.stop="openEditPlanModal(plan)"
                class="btn-action btn-edit"
              >
                ✎
              </button>
            </td>
          </tr>

          <tr v-if="filteredPlans.length === 0">
            <td colspan="8" class="empty-state">
              No periodic plans found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drawer -->
    <PeriodFinanceDrawer
      v-if="selectedPlan"
      :plan="selectedPlan"
      :read-only="!isBoss"
      @close="selectedPlan = null"
    />

    <!-- Modals -->
    <CreatePeriodModal
      v-if="showCreatePeriodModal"
      @close="showCreatePeriodModal = false"
      @saved="handlePeriodCreated"
    />

    <PeriodicPlanModal
      v-if="showCreatePlanModal"
      :plan="editingPlan"
      @close="closePlanModal"
      @saved="handlePlanSaved"
    />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useAuthStore } from '../stores/auth';
import { fetchUsers } from '../services/users';
import { formatCurrency, formatDate } from '../utils/financeHelpers';

import PeriodFinanceDrawer from '../components/finance/PeriodFinanceDrawer.vue';
import PeriodicPlanModal from '../components/finance/PeriodicPlanModal.vue';
import CreatePeriodModal from '../components/finance/CreatePeriodModal.vue';
import * as financeServices from '../services/finance';
const authStore = useAuthStore();
const isBoss = computed(() =>
  ['SUPER_ADMIN', 'ADMIN', 'BOSS'].includes(authStore.user?.role)
);

const {
  periods,
  periodicPlans,
  selectedPeriodId,
  selectedUserId,
  loading,
  error,
    fetchPeriodicPlans,
    fetchPeriods
} = useFinance();


const allUsers = ref([]);
const selectedPlan = ref(null);
const editingPlan = ref(null);
const showCreatePeriodModal = ref(false);
const showCreatePlanModal = ref(false);
const currency = ref('USD');

const filteredPlans = computed(() => {
    console.log("Filtering plans with selectedPeriodId:", selectedPeriodId.value, "and selectedUserId:", selectedUserId.value, periodicPlans);
  let plans = periodicPlans.value;

  if (selectedPeriodId.value) {
    plans = plans.filter(
      p => p.periodId?._id === selectedPeriodId.value
    );
  }

  if (selectedUserId.value) {
    plans = plans.filter(
      p => (p.userId?._id || p.userId) === selectedUserId.value
    );
  }

  return plans;
});

const getUserName = (user) =>
  typeof user === 'object'
    ? user.name || user.email
    : allUsers.value.find(u => u._id === user)?.name || 'Unknown';

const openCreatePeriodModal = () => {
  showCreatePeriodModal.value = true;
};

const openCreatePlanModal = () => {
  editingPlan.value = null;
  showCreatePlanModal.value = true;
};

const openEditPlanModal = (plan) => {
  editingPlan.value = plan;
  showCreatePlanModal.value = true;
};

const openPeriodDrawer = (plan) => {
  selectedPlan.value = plan;
};

const closePlanModal = () => {
  editingPlan.value = null;
  showCreatePlanModal.value = false;
};

const handlePlanSaved = async () => {
  closePlanModal();
  await fetchPeriodicPlans();
};

const handlePeriodCreated = async () => {
  showCreatePeriodModal.value = false;
//   console.log("Fetching periods after creation",await fetchPeriods());
  await fetchPeriods();
};

const loadData = async () => {
  const usersRes = await fetchUsers();
  allUsers.value = usersRes.data?.users || [];
//    console.log("Fetching periods after creation",await fetchPeriods());

//   await Promise.all([
//     fetchPeriods(),
//     fetchPeriodicPlans()
//   ]);
};

onMounted(loadData);
</script>
<style scoped>
  .btn-action {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-action:hover {
  background: #f9fafb;
}

.btn-edit:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}
.periodic-plans-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #2563eb;
}

.filters-section {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 150px;
}

.table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.periodic-plans-table {
  width: 100%;
  border-collapse: collapse;
}

.periodic-plans-table thead {
  background: #f9fafb;
}

.periodic-plans-table th {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.periodic-plans-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.table-row-clickable {
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row-clickable:hover {
  background-color: #f9fafb;
}

.target-value {
  color: #6366f1;
  font-weight: 500;
}

.income-value {
  color: #10b981;
  font-weight: 500;
}

.expense-value {
  color: #ef4444;
  font-weight: 500;
}

.pending-value {
  color: #f59e0b;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 48px;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}
</style> -->
