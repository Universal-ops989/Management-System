<template>
  <div class="month-selector">
    <div class="select-group">
      <select
        v-model="localYear"
        @change="updateValue"
        :disabled="disabled"
        class="year-select"
      >
        <option value="">Year</option>
        <option
          v-for="year in years"
          :key="year"
          :value="year"
        >
          {{ year }}
        </option>
      </select>
      
      <select
        v-model="localMonth"
        @change="updateValue"
        :disabled="disabled"
        class="month-select"
      >
        <option value="">Month</option>
        <option
          v-for="(month, index) in months"
          :key="index"
          :value="String(index + 1).padStart(2, '0')"
        >
          {{ month }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  minYear: {
    type: Number,
    default: null
  },
  maxYear: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const defaultMinYear = props.minYear || currentYear - 10;
const defaultMaxYear = props.maxYear || currentYear + 10;

const years = computed(() => {
  const yearList = [];
  for (let year = defaultMinYear; year <= defaultMaxYear; year++) {
    yearList.push(year);
  }
  return yearList.reverse(); // Most recent years first
});

const localYear = ref('');
const localMonth = ref('');

// Parse modelValue (format: "YYYY-MM")
const parseValue = (value) => {
  if (!value) {
    localYear.value = '';
    localMonth.value = '';
    return;
  }
  
  const parts = value.split('-');
  if (parts.length === 2) {
    localYear.value = parts[0];
    localMonth.value = parts[1];
  } else {
    localYear.value = '';
    localMonth.value = '';
  }
};

// Update value when modelValue changes
watch(() => props.modelValue, (newValue) => {
  parseValue(newValue);
}, { immediate: true });

// Emit update when local values change
const updateValue = () => {
  if (localYear.value && localMonth.value) {
    const value = `${localYear.value}-${localMonth.value}`;
    emit('update:modelValue', value);
  } else {
    emit('update:modelValue', '');
  }
};
</script>

<style scoped>
.month-selector {
  width: 100%;
}

.select-group {
  display: flex;
  gap: 8px;
}

.year-select,
.month-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s;
}

.year-select:hover:not(:disabled),
.month-select:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.year-select:focus,
.month-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.year-select:disabled,
.month-select:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.year-select option,
.month-select option {
  padding: 8px;
}
</style>

