<template>
    <div class="periodic-plans-view">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <div>
                    <h1>Periodic Financial Plans</h1>
                    <p class="subtitle">
                        Manage weekly periods and their financial goals
                    </p>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
            <div class="filter-group">
                <label>Month:</label>
                <input v-model="selectedMonth" type="month" class="filter-input" @change="loadData" />
            </div>
            <div class="filter-group">
                <label>User:</label>
                <select v-model="selectedUserId" class="filter-select" @change="loadData">
                    <option value="">All Users</option>
                    <option v-for="user in allUsers" :key="user.id" :value="user.id">
                        {{ user.name || user.email }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading data...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button @click="loadData" class="btn-retry">Retry</button>
        </div>

        <!-- Main Content: Left-Right Layout -->
        <div v-else class="main-content">
            <!-- Left Section: Periods List -->
            <div class="left-section">
                <div class="section-header">
                    <h2>Weeks</h2>
                    <button v-if="isBoss" @click="showCreatePeriodModal = true" class="btn-primary btn-small">
                        + Create Week
                    </button>
                </div>
                
                <div class="periods-list">
                    <div
                        v-for="period in filteredPeriods"
                        :key="period._id"
                        :class="['period-item', { active: selectedPeriodId === period._id }]"
                        @click="selectPeriod(period)"
                    >
                        <div class="period-header">
                            <div class="period-name">{{ period.definition }}</div>
                            <div v-if="isBoss" class="period-actions" @click.stop>
                                <button
                                    class="btn-icon"
                                    @click.stop="openEditPeriodModal(period)"
                                    title="Edit Week"
                                >
                                    ✎
                                </button>
                            </div>
                        </div>
                        <div class="period-dates">
                            {{ formatDate(period.startDate) }} – {{ formatDate(period.endDate) }}
                        </div>
                        <div class="period-month">{{ period.month }}</div>
                        <div class="period-plans-count">
                            {{ getPlansCountForPeriod(period._id) }} plan(s)
                        </div>
                    </div>

                    <div v-if="filteredPeriods.length === 0" class="empty-state">
                        No weeks found for selected month
                    </div>
                </div>
            </div>

            <!-- Right Section: Periodic Plans for Selected Period -->
            <div class="right-section">
                <div class="section-header">
                    <h2>
                        {{ selectedPeriod ? `Plans for ${selectedPeriod.definition}` : 'Select a Week' }}
                    </h2>
                    <button
                        v-if="isBoss && selectedPeriod"
                        @click="openCreatePlanModal"
                        class="btn-primary btn-small"
                    >
                        + Create Weekly Plan
                    </button>
                </div>

                <div v-if="!selectedPeriod" class="empty-state-select">
                    <p>Select a week from the left to view its plans</p>
                </div>

                <div v-else class="plans-list">
                    <table class="plans-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Target</th>
                                <th>Actual</th>
                                <th>Pending</th>
                                <th>Gap</th>
                                <th v-if="isBoss">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="plan in plansForSelectedPeriod"
                                :key="plan._id"
                                class="plan-row"
                                @click="openPeriodDrawer(plan)"
                            >
                                <td>{{ getUserName(plan.userId) }}</td>
                                <td class="target-value">
                                    {{ formatCurrency(plan.periodicFinancialGoal, currency) }}
                                </td>
                                <td class="income-value">
                                    {{ formatCurrency(getPeriodActual(plan), currency) }}
                                </td>
                                <td class="pending-value">
                                    {{ formatCurrency(getPeriodPending(plan), currency) }}
                                </td>
                                <td :class="{
                                    'income-value': getPeriodGap(plan) >= 0,
                                    'expense-value': getPeriodGap(plan) < 0
                                }">
                                    {{ formatCurrency(getPeriodGap(plan), currency) }}
                                </td>
                                <td v-if="isBoss" class="actions-cell" @click.stop>
                                    <button
                                        class="btn-action btn-edit"
                                        title="Edit"
                                        @click.stop="openEditPlanModal(plan)"
                                    >
                                        ✎
                                    </button>
                                </td>
                            </tr>

                            <tr v-if="plansForSelectedPeriod.length === 0">
                                <td :colspan="isBoss ? 6 : 5" class="empty-state">
                                    No plans found for this week
                                </td>
                            </tr>
                            <!-- Total Row -->
                            <tr v-if="plansForSelectedPeriod.length > 0" class="total-row">
                                <td class="total-label"><strong>Total</strong></td>
                                <td class="target-value total-amount">
                                    {{ formatCurrency(totalTarget, currency) }}
                                </td>
                                <td class="income-value total-amount">
                                    {{ formatCurrency(totalActual, currency) }}
                                </td>
                                <td class="pending-value total-amount">
                                    {{ formatCurrency(totalPending, currency) }}
                                </td>
                                <td :class="{
                                    'income-value': totalGap >= 0,
                                    'expense-value': totalGap < 0,
                                    'total-amount': true
                                }">
                                    {{ formatCurrency(totalGap, currency) }}
                                </td>
                                <td v-if="isBoss"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Drawer -->
        <PeriodFinanceDrawer
            v-if="selectedPlan"
            :plan="selectedPlan"
            :read-only="!isBoss"
            @close="closePeriodDrawer"
        />

        <!-- Modals -->
        <CreatePeriodModal
            :isOpen="showCreatePeriodModal"
            @close="showCreatePeriodModal = false"
            @saved="handlePeriodCreated"
        />
        <EditPeriodModal
            :isOpen="showEditPeriodModal"
            :period="editingPeriod"
            @close="showEditPeriodModal = false"
            @saved="handlePeriodUpdated"
        />
        <PeriodicPlanModal
            :isOpen="showPlanModal"
            :plan="editingPlan"
            :periods="periods"
            @close="closePlanModal"
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
import {
    formatCurrency,
    formatDate,
    getCurrentMonth
} from '../utils/financeHelpers';

import PeriodFinanceDrawer from '../components/finance/PeriodFinanceDrawer.vue';
import PeriodicPlanModal from '../components/finance/PeriodicPlanModal.vue';
import CreatePeriodModal from '../components/finance/CreatePeriodModal.vue';
import EditPeriodModal from '../components/finance/EditPeriodModal.vue';

const authStore = useAuthStore();

const isBoss = computed(() => {
    const role = authStore.user?.role;
    return ['SUPER_ADMIN', 'ADMIN', 'BOSS'].includes(role);
});

const {
    periodicPlans,
    transactions,
    loading,
    error,
    periods,
    loadPeriodicPlans,
    loadTransactions,
    loadPeriods,
    fetchPeriodicPlans
} = useFinance();

const selectedMonth = ref(getCurrentMonth());
const selectedUserId = ref('');
const allUsers = ref([]);
const selectedPeriodId = ref(null);
const selectedPeriod = ref(null);
const selectedPlan = ref(null);
const currency = ref('USD');

// Modal states
const showCreatePeriodModal = ref(false);
const showEditPeriodModal = ref(false);
const editingPeriod = ref(null);
const showPlanModal = ref(false);
const editingPlan = ref(null);

/* -------------------- COMPUTED -------------------- */

const filteredPeriods = computed(() => {
    if (!selectedMonth.value) {
        return periods.value || [];
    }
    return (periods.value || []).filter(
        p => p.month === selectedMonth.value
    );
});

const plansForSelectedPeriod = computed(() => {
    if (!selectedPeriodId.value) {
        return [];
    }

    let plans = periodicPlans.value || [];

    // Filter by selected period
    plans = plans.filter(
        p => (p.periodId?._id || p.periodId) === selectedPeriodId.value
    );

    // Filter by selected user if applicable
    if (selectedUserId.value) {
        plans = plans.filter(p => {
            const uid =
                typeof p.userId === 'object'
                    ? p.userId._id
                    : p.userId;
            return uid === selectedUserId.value;
        });
    }

    return plans;
});

// Calculate totals for plans table
const totalTarget = computed(() => {
    return plansForSelectedPeriod.value.reduce((sum, plan) => sum + (plan.periodicFinancialGoal || 0), 0);
});

const totalActual = computed(() => {
    return plansForSelectedPeriod.value.reduce((sum, plan) => sum + getPeriodActual(plan), 0);
});

const totalPending = computed(() => {
    return plansForSelectedPeriod.value.reduce((sum, plan) => sum + getPeriodPending(plan), 0);
});

const totalGap = computed(() => {
    return totalTarget.value - (totalActual.value + totalPending.value);
});

/* -------------------- HELPERS -------------------- */

const getUserName = (userId) => {
    if (typeof userId === 'object' && userId) {
        return userId.name || userId.email || 'Unknown';
    }
    const user = allUsers.value.find(u => u._id === userId);
    return user?.name || user?.email || 'Unknown';
};

const getPlansCountForPeriod = (periodId) => {
    return (periodicPlans.value || []).filter(
        p => (p.periodId?._id || p.periodId) === periodId
    ).length;
};

const getPeriodActual = (plan) => {
    if (!plan.periodId) return 0;
    
    const { startDate, endDate } = plan.periodId;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const planUserId =
        typeof plan.userId === 'object'
            ? plan.userId._id
            : plan.userId;

    return (transactions.value || [])
        .filter(t => {
            const txDate = new Date(t.date);
            const txUserId =
                typeof t.userId === 'object'
                    ? t.userId._id
                    : t.userId;

            return (
                txDate >= start &&
                txDate <= end &&
                txUserId === planUserId &&
                t.status === 'accepted' &&
                t.type === 'income'
            );
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

const getPeriodPending = (plan) => {
    if (!plan.periodId) return 0;
    
    const { startDate, endDate } = plan.periodId;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const planUserId =
        typeof plan.userId === 'object'
            ? plan.userId._id
            : plan.userId;

    return (transactions.value || [])
        .filter(t => {
            const txDate = new Date(t.date);
            const txUserId =
                typeof t.userId === 'object'
                    ? t.userId._id
                    : t.userId;

            return (
                txDate >= start &&
                txDate <= end &&
                txUserId === planUserId &&
                t.status === 'pending' &&
                t.type === 'income'
            );
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

const getPeriodGap = (plan) => {
    const actual = getPeriodActual(plan);
    const pending = getPeriodPending(plan);
    return plan.periodicFinancialGoal - (actual + pending);
};

/* -------------------- UI ACTIONS -------------------- */

const selectPeriod = (period) => {
    selectedPeriodId.value = period._id;
    selectedPeriod.value = period;
};

const openCreatePlanModal = () => {
    editingPlan.value = null;
    showPlanModal.value = true;
};

const openEditPlanModal = (plan) => {
    editingPlan.value = plan;
    showPlanModal.value = true;
};

const openEditPeriodModal = (period) => {
    editingPeriod.value = period;
    showEditPeriodModal.value = true;
};

const openPeriodDrawer = (plan) => {
    selectedPlan.value = plan;
};

const closePeriodDrawer = () => {
    selectedPlan.value = null;
};

const closePlanModal = () => {
    editingPlan.value = null;
    showPlanModal.value = false;
};

const handlePlanSaved = async () => {
    closePlanModal();
    // Reload all plans to update counts
    try {
        const response = await fetchPeriodicPlans({});
        if (response.ok) {
            periodicPlans.value = response.data?.plans || response.data?.periodicPlans || [];
        }
    } catch (err) {
        console.error('Error reloading plans:', err);
        // Still reload all data as fallback
        loadData();
    }
};

const handlePeriodCreated = () => {
    showCreatePeriodModal.value = false;
    loadData();
};

const handlePeriodUpdated = () => {
    showEditPeriodModal.value = false;
    editingPeriod.value = null;
    loadData();
};

/* -------------------- DATA LOADING -------------------- */

const loadData = async () => {
    try {
        const usersRes = await fetchUsers();
        if (usersRes.ok) {
            allUsers.value = excludeSuperAdmin(usersRes.data.users || []);
        }

        const res = await loadPeriods();
        periods.value = res.periods || [];

        // Load ALL periodic plans initially (without user filter) so counts work for all periods
        const response = await fetchPeriodicPlans({});
        if (response.ok) {
            periodicPlans.value = response.data?.plans || response.data?.periodicPlans || [];
        } else {
            periodicPlans.value = [];
        }

        if (selectedMonth.value) {
            const [y, m] = selectedMonth.value.split('-').map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59, 999);

            await loadTransactions({
                from: start.toISOString(),
                to: end.toISOString()
            });
        }

        // Auto-select first period if none selected
        if (!selectedPeriodId.value && filteredPeriods.value.length > 0) {
            selectPeriod(filteredPeriods.value[0]);
        }
    } catch (err) {
        console.error(err);
    }
};

watch([selectedMonth], () => {
    loadData();
    // Reset selection when month filter changes
    selectedPeriodId.value = null;
    selectedPeriod.value = null;
});

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.periodic-plans-view {
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
    grid-template-columns: 350px 1fr;
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

.periods-list {
    max-height: calc(100vh - 300px);
    overflow-y: auto;
}

.period-item {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;
}

.period-item:hover {
    background-color: #f9fafb;
}

.period-item.active {
    background-color: #dbeafe;
    border-left: 4px solid #3b82f6;
}

.period-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.period-name {
    font-weight: 600;
    color: #111827;
    font-size: 15px;
}

.period-actions {
    display: flex;
    gap: 8px;
}

.btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 16px;
    color: #6b7280;
    transition: all 0.2s;
}

.btn-icon:hover {
    background: #e5e7eb;
    color: #111827;
}

.period-dates {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
}

.period-month {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 8px;
}

.period-plans-count {
    font-size: 12px;
    color: #3b82f6;
    font-weight: 500;
}

.plans-list {
    padding: 20px;
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
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
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

    .periods-list {
        max-height: 400px;
    }
}
</style>
