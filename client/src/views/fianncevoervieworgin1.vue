<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/utils/axios'

// --------------------
// State
// --------------------
const loading = ref(false)
const metrics = ref(null)

// Filters
const selectedScope = ref('month') // week | month | year
const selectedMonth = ref('2026-01')
const selectedUser = ref('me') // me | all

// --------------------
// Fetch data
// --------------------
const fetchFinanceOverview = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/finance-overview', {
      params: {
        start: `${selectedMonth.value}-01T00:00:00.000Z`,
        end: `${selectedMonth.value}-31T23:59:59.999Z`
      }
    })

    metrics.value = data.data.metrics
  } finally {
    loading.value = false
  }
}

onMounted(fetchFinanceOverview)
watch(selectedMonth, fetchFinanceOverview)

// --------------------
// Computed metrics
// --------------------
const activeMetrics = computed(() => {
  if (!metrics.value) return null

  if (selectedScope.value === 'year') {
    return metrics.value.year
  }

  if (selectedScope.value === 'month') {
    return metrics.value.month
  }

  return null
})

const weeklyMetrics = computed(() => {
  if (!metrics.value || selectedScope.value !== 'week') return []
  return metrics.value.week
})
</script>

<template>
  <div class="finance-overview">
    <!-- Filters -->
    <div class="filters inline-controls">
      <div class="filter-group">
        <label>Scope</label>
        <select v-model="selectedScope" class="filter-select">
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Month</label>
        <input type="month" v-model="selectedMonth" class="filter-input" />
      </div>
    </div>

    <!-- KPI Cards -->
    <div v-if="activeMetrics" class="kpis">
      <KpiCard title="Actual Income" :value="activeMetrics.actualIncome" />
      <KpiCard title="Actual Outcome" :value="activeMetrics.actualExpense" />
      <KpiCard title="Pending Income" :value="activeMetrics.pendingIncome" />
      <KpiCard title="Target" :value="activeMetrics.target" />
      <KpiCard title="Gap" :value="activeMetrics.gap" />
    </div>

    <!-- Weekly Table -->
    <WeeklyTable
      v-if="selectedScope === 'week'"
      :rows="weeklyMetrics"
    />
  </div>
</template>
