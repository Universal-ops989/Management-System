import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../services/axios';

/**
 * API store for managing API state and common operations
 */
export const useApiStore = defineStore('api', () => {
  const loading = ref(false);
  const error = ref(null);

  const setLoading = (value) => {
    loading.value = value;
  };

  const setError = (err) => {
    error.value = err;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  };
});

