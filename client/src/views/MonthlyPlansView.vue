<template>
  <div class="monthly-plans-view">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Monthly Financial Plans</h1>
          <p class="subtitle">View and manage monthly financial goals for all users</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Year:</label>
        <select v-model="selectedYear" @change="loadData" class="filter-select">
          <option value="">All Years</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading monthly plans...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Retry</button>
    </div>

    <!-- Main Content: Left-Right Layout -->
    <div v-else class="main-content">
      <!-- Left Section: Users List -->
      <div class="left-section">
        <div class="section-header">
          <h2>Users</h2>
        </div>
        
        <div class="users-list">
          <!-- All Users Option -->
          <div
            :class="['user-item', 'all-users-item', { active: selectedUserId === 'all' }]"
            @click="selectAllUsers"
          >
            <div class="user-name">📊 All Users</div>
            <div class="user-plans-count">
              {{ getAllPlansCount() }} plan(s)
            </div>
          </div>

          <!-- Individual Users -->
          <div
            v-for="user in allUsers"
            :key="user._id || user.id"
            :class="['user-item', { active: selectedUserId === (user._id || user.id) }]"
            @click="selectUser(user)"
          >
            <div class="user-name">{{ user.name || user.email }}</div>
            <div class="user-plans-count">
              {{ getPlansCountForUser(user._id || user.id) }} plan(s)
            </div>
          </div>

          <div v-if="allUsers.length === 0" class="empty-state">
            No users found
          </div>
        </div>
      </div>

      <!-- Right Section: Monthly Plans for Selected User -->
      <div class="right-section">
        <div class="section-header">
          <h2>
            {{ getSectionTitle() }}
          </h2>
          <button
            v-if="isBoss && selectedUserId && selectedUserId !== 'all'"
            @click="openCreateModal"
            class="btn-primary btn-small"
          >
            + Create Monthly Plan
          </button>
        </div>

        <div v-if="!selectedUserId" class="empty-state-select">
          <p>Select a user from the left to view their monthly plans</p>
        </div>

        <div v-else class="plans-content">
          <!-- Group plans by year -->
          <div
            v-for="yearGroup in plansByYear"
            :key="yearGroup.year"
            class="year-group"
          >
            <h3 class="year-header">{{ yearGroup.year }}</h3>
            <table class="plans-table">
              <thead>
                <tr>
                  <th v-if="selectedUserId === 'all'">Month</th>
                  <th v-else>Month</th>
                  <th>Monthly Target</th>
                  <th>Number of Periods</th>
                  <th v-if="selectedUserId !== 'all'">Note</th>
                  <th v-if="selectedUserId === 'all'">Users</th>
                  <th v-if="isBoss && selectedUserId !== 'all'">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Show aggregated data when "All" is selected -->
                <template v-if="selectedUserId === 'all'">
                  <tr
                    v-for="monthData in yearGroup.plans"
                    :key="monthData.month"
                    class="plan-row"
                  >
                    <td>{{ formatMonth(monthData.month) }}</td>
                    <td class="target-value">
                      {{ formatCurrency(monthData.totalTarget, currency) }}
                    </td>
                    <td>{{ monthData.totalPeriods }}</td>
                    <td>{{ monthData.userCount }} user(s)</td>
                  </tr>
                  <tr v-if="yearGroup.plans.length === 0">
                    <td :colspan="4" class="empty-state">
                      No plans for {{ yearGroup.year }}
                    </td>
                  </tr>
                </template>
                <!-- Show individual user plans -->
                <template v-else>
                  <tr
                    v-for="plan in yearGroup.plans"
                    :key="plan._id"
                    class="plan-row"
                    @click="openPlanDrawer(plan)"
                  >
                    <td>{{ formatMonth(plan.month) }}</td>
                    <td class="target-value">
                      {{ formatCurrency(plan.monthlyFinancialGoal, currency) }}
                    </td>
                    <td>{{ getPeriodCount(plan) }}</td>
                    <td class="note-cell">{{ plan.note || '-' }}</td>
                    <td v-if="isBoss" class="actions-cell" @click.stop>
                      <button
                        class="btn-action btn-edit"
                        title="Edit"
                        @click.stop="openEditModal(plan)"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                  <tr v-if="yearGroup.plans.length === 0">
                    <td :colspan="isBoss ? 5 : 4" class="empty-state">
                      No plans for {{ yearGroup.year }}
                    </td>
                  </tr>
                </template>
                <!-- Total Row for Year -->
                <tr v-if="yearGroup.plans.length > 0" class="total-row">
                  <td class="total-label"><strong>Total ({{ yearGroup.year }})</strong></td>
                  <td class="target-value total-amount">
                    {{ formatCurrency(getYearTotal(yearGroup.year), currency) }}
                  </td>
                  <td v-if="selectedUserId === 'all'">{{ getYearTotalPeriods(yearGroup.year) }}</td>
                  <td v-if="selectedUserId === 'all'"></td>
                  <td v-if="selectedUserId !== 'all'" colspan="3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="plansByYear.length === 0" class="empty-state">
            No monthly plans found for this user
          </div>
        </div>
      </div>
    </div>

    <!-- Plan Drawer -->
    <MonthlyPlanDrawer
      v-if="selectedPlan"
      :plan="selectedPlan"
      :read-only="!isBoss"
      @close="closePlanDrawer"
      @updated="handlePlanUpdated"
    />

    <!-- Create/Edit Modal -->
    <MonthlyPlanModal
      :isOpen="showModal"
      :plan="editingPlan"
      :selectedUserId="selectedUserId"
      @close="closeModal"
      @saved="handlePlanSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useAuthStore } from '../composables/useAuth';
import { fetchUsers } from '../services/users';
import { excludeSuperAdmin } from '../utils/userFilters';
import { formatCurrency, formatMonth, getCurrentMonth } from '../utils/financeHelpers';
import MonthlyPlanDrawer from '../components/finance/MonthlyPlanDrawer.vue';
import MonthlyPlanModal from '../components/finance/MonthlyPlanModal.vue';

const authStore = useAuthStore();
const isBoss = computed(() => {
  const role = authStore.user?.role;
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'BOSS';
});

const {
  monthlyPlans,
  loading,
  error,
  loadMonthlyPlans
} = useFinance();

const selectedYear = ref(new Date().getFullYear().toString());
const selectedUserId = ref('');
const selectedUser = ref(null);
const allUsers = ref([]);
const selectedPlan = ref(null);
const showModal = ref(false);
const editingPlan = ref(null);
const currency = ref('USD');

/* -------------------- COMPUTED -------------------- */

const plansForSelectedUser = computed(() => {
  if (!selectedUserId.value) {
    return [];
  }

  let plans = monthlyPlans.value || [];

  // If "All" is selected, don't filter by user
  if (selectedUserId.value !== 'all') {
    // Filter by selected user
    plans = plans.filter(p => {
      const userId = typeof p.userId === 'object' ? p.userId._id : p.userId;
      return userId === selectedUserId.value;
    });
  }

  // Filter by selected year if applicable
  if (selectedYear.value) {
    plans = plans.filter(p => {
      if (!p.month) return false;
      const planYear = p.month.split('-')[0];
      return planYear === selectedYear.value;
    });
  }

  return plans.sort((a, b) => {
    // Sort by month descending (newest first)
    if (a.month < b.month) return 1;
    if (a.month > b.month) return -1;
    return 0;
  });
});

const plansByYear = computed(() => {
  const grouped = {};
  
  if (selectedUserId.value === 'all') {
    // Aggregate all users' plans by month
    const monthAggregates = {};
    
    plansForSelectedUser.value.forEach(plan => {
      if (!plan.month) return;
      
      if (!monthAggregates[plan.month]) {
        monthAggregates[plan.month] = {
          month: plan.month,
          totalTarget: 0,
          totalPeriods: 0,
          userCount: 0,
          users: new Set()
        };
      }
      
      monthAggregates[plan.month].totalTarget += plan.monthlyFinancialGoal || 0;
      monthAggregates[plan.month].totalPeriods += getPeriodCount(plan);
      const userId = typeof plan.userId === 'object' ? plan.userId._id : plan.userId;
      monthAggregates[plan.month].users.add(userId);
      monthAggregates[plan.month].userCount = monthAggregates[plan.month].users.size;
    });
    
    // Group aggregated months by year
    Object.values(monthAggregates).forEach(monthData => {
      const year = monthData.month.split('-')[0];
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(monthData);
    });
    
    // Convert to array and sort years descending
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({
        year,
        plans: grouped[year].sort((a, b) => {
          // Sort months within year descending
          if (a.month < b.month) return 1;
          if (a.month > b.month) return -1;
          return 0;
        })
      }));
  } else {
    // Individual user view - original logic
    plansForSelectedUser.value.forEach(plan => {
      if (!plan.month) return;
      const year = plan.month.split('-')[0];
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(plan);
    });

    // Convert to array and sort years descending
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({
        year,
        plans: grouped[year].sort((a, b) => {
          // Sort months within year descending
          if (a.month < b.month) return 1;
          if (a.month > b.month) return -1;
          return 0;
        })
      }));
  }
});

const availableYears = computed(() => {
  const years = new Set();
  monthlyPlans.value.forEach(plan => {
    if (plan.month) {
      const year = plan.month.split('-')[0];
      years.add(year);
    }
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
});

/* -------------------- HELPERS -------------------- */

const getPlansCountForUser = (userId) => {
  return (monthlyPlans.value || []).filter(p => {
    const planUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
    return planUserId === userId;
  }).length;
};

const getPeriodCount = (plan) => {
  if (Array.isArray(plan.periodicPlanIds)) {
    return plan.periodicPlanIds.length;
  }
  return 0;
};

const getYearTotal = (year) => {
  if (selectedUserId.value === 'all') {
    // Sum all aggregated month totals for the year
    const yearGroup = plansByYear.value.find(g => g.year === year);
    if (!yearGroup) return 0;
    return yearGroup.plans.reduce((sum, monthData) => sum + (monthData.totalTarget || 0), 0);
  } else {
    // Original logic for individual user
    const yearPlans = plansForSelectedUser.value.filter(p => {
      if (!p.month) return false;
      return p.month.startsWith(year);
    });
    return yearPlans.reduce((sum, plan) => sum + (plan.monthlyFinancialGoal || 0), 0);
  }
};

const getYearTotalPeriods = (year) => {
  const yearGroup = plansByYear.value.find(g => g.year === year);
  if (!yearGroup) return 0;
  return yearGroup.plans.reduce((sum, monthData) => sum + (monthData.totalPeriods || 0), 0);
};

const getAllPlansCount = () => {
  return (monthlyPlans.value || []).length;
};

const getSectionTitle = () => {
  if (selectedUserId.value === 'all') {
    return 'Monthly Plans - All Users (Aggregated)';
  } else if (selectedUser.value) {
    return `Monthly Plans - ${selectedUser.value.name || selectedUser.value.email}`;
  } else {
    return 'Select a User';
  }
};

const selectAllUsers = () => {
  selectedUserId.value = 'all';
  selectedUser.value = { name: 'All Users', _id: 'all' };
};

/* -------------------- UI ACTIONS -------------------- */

const selectUser = (user) => {
  const userId = user._id || user.id;
  selectedUserId.value = userId;
  selectedUser.value = user;
};

const openCreateModal = () => {
  editingPlan.value = null;
  showModal.value = true;
};

const openEditModal = (plan) => {
  editingPlan.value = plan;
  showModal.value = true;
};

const openPlanDrawer = (plan) => {
  selectedPlan.value = plan;
};

const closePlanDrawer = () => {
  selectedPlan.value = null;
};

const closeModal = () => {
  showModal.value = false;
  editingPlan.value = null;
};

const handlePlanSaved = () => {
  closeModal();
  // Reload all plans to update counts
  loadMonthlyPlans({});
};

const handlePlanUpdated = () => {
  // Reload all plans to update counts
  loadMonthlyPlans({});
};

/* -------------------- DATA LOADING -------------------- */

const loadData = async () => {
  try {
    // Load users
    const usersResponse = await fetchUsers();
    if (usersResponse.ok && usersResponse.data) {
      allUsers.value = excludeSuperAdmin(usersResponse.data.users || []);
      
      // Auto-select "All" if none selected
      if (!selectedUserId.value) {
        selectAllUsers();
      }
    }

    // Load ALL monthly plans initially (without user filter) so counts work for all users
    await loadMonthlyPlans({});
  } catch (err) {
    console.error('Error loading monthly plans:', err);
  }
};

watch(selectedUserId, () => {
  // When user changes, we don't need to reload plans since we already have all plans
  // The computed properties will handle filtering
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.monthly-plans-view {
  padding: 24px;
  max-width: 1600px;
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

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
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

.main-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}

.left-section,
.right-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.users-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.user-item {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-item.active {
  background-color: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.all-users-item {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-left: 3px solid var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.all-users-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border-left: 4px solid var(--color-primary);
}

.user-name {
  font-weight: 600;
  color: #111827;
  font-size: 15px;
  margin-bottom: 4px;
}

.user-plans-count {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
}

.plans-content {
  padding: 20px;
}

.year-group {
  margin-bottom: 32px;
}

.year-group:last-child {
  margin-bottom: 0;
}

.year-header {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.plans-table {
  width: 100%;
  border-collapse: collapse;
}

.plans-table thead {
  background: #f9fafb;
}

.plans-table th {
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.plans-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.plan-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.plan-row:hover {
  background-color: #f9fafb;
}

.target-value {
  color: #6366f1;
  font-weight: 500;
}

.note-cell {
  color: #6b7280;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

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

.empty-state,
.empty-state-select {
  text-align: center;
  color: #9ca3af;
  padding: 48px 24px;
}

.empty-state-select {
  padding: 80px 24px;
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

.total-row {
  background-color: #f9fafb;
  border-top: 2px solid #e5e7eb;
  font-weight: 600;
}

.total-label {
  text-align: right;
  padding: 16px 12px;
  color: #111827;
}

.total-amount {
  padding: 16px 12px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .left-section {
    margin-bottom: 24px;
  }

  .users-list {
    max-height: 400px;
  }
}
</style>
