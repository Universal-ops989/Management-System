import apiClient from '../../../services/axios';
import router from '../../../router';
import { nextTick } from 'vue';

export default {
  async login({ commit }, { email, password }) {
    try {
      console.log('[AUTH] Attempting login for:', email);
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('[AUTH] Login response:', response.data);
      
      if (response.data.ok && response.data.data) {
        commit('SET_TOKEN', response.data.data.token);
        commit('SET_USER', response.data.data.user);
        console.log('[AUTH] Login successful');
        return response.data;
      } else {
        console.error('[AUTH] Login failed - invalid response:', response.data);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      console.error('[AUTH] Error response:', error.response?.data);
      const errorData = error.response?.data || { message: 'Login failed' };
      throw new Error(errorData.message || 'Login failed');
    }
  },

  async logout({ commit }) {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      commit('CLEAR_AUTH');
      // Wait for Vue reactivity to update before navigating
      await nextTick();
      // Force navigation to login page - use replace to avoid adding to history
      // Check if we're already on login page to avoid unnecessary navigation
      if (router.currentRoute.value.path !== '/login') {
        router.replace('/login').catch(() => {
          // If navigation fails, force reload to login page
          window.location.href = '/login';
        });
      }
    }
  },

  restoreAuth({ commit }) {
    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');
    
    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        commit('SET_TOKEN', storedToken);
        commit('SET_USER', storedUser);
      } catch (error) {
        // Clear invalid data
        commit('CLEAR_AUTH');
      }
    }
  }
};
