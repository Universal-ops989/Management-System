import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
import apiClient from '../services/axios';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  // Restore from localStorage on initialization
  const token = ref(localStorage.getItem('token') || null);
  const userStr = localStorage.getItem('user');
  const user = ref(userStr ? JSON.parse(userStr) : null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const login = async (email, password) => {
    try {
      console.log('[AUTH] Attempting login for:', email);
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('[AUTH] Login response:', response.data);
      
      // Server returns: { ok: true, message: '...', data: { token, user } }
      console.log('[AUTH] response.data.data:', response.data.data);
      console.log('[AUTH] response.data.ok:', response.data.ok);
      if (response.data.ok && response.data.data) {
        token.value = response.data.data.token;
        user.value = response.data.data.user;
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
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
  };

  const logout = async () => {
    try {
      // Call logout endpoint (stateless, but good practice)
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear state first
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
  };

  const restoreAuth = () => {
    // Restore auth state from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken;
        user.value = JSON.parse(storedUser);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        token.value = null;
        user.value = null;
      }
    }
  };

  // Restore on store creation
  restoreAuth();

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    restoreAuth
  };
});

// stores/auth.js
// import { defineStore } from 'pinia';
// import { ref, computed } from 'vue';
// import apiClient from '../services/axios';
// import router from '../router';

// export const useAuthStore = defineStore('auth', () => {
//   const token = ref(localStorage.getItem('token'));
//   const user = ref(
//     localStorage.getItem('user')
//       ? JSON.parse(localStorage.getItem('user'))
//       : null
//   );

//   const isAuthenticated = computed(() => !!token.value && !!user.value);

//   // --------------------
//   // LOGIN
//   // --------------------
//   const login = async (email, password) => {
//     const response = await apiClient.post('/auth/login', { email, password });

//     if (!response.data?.ok) {
//       throw new Error(response.data?.message || 'Login failed');
//     }

//     token.value = response.data.data.token;
//     user.value = response.data.data.user;

//     localStorage.setItem('token', token.value);
//     localStorage.setItem('user', JSON.stringify(user.value));

//     // 🔥 IMPORTANT
//     apiClient.defaults.headers.common.Authorization =
//       `Bearer ${token.value}`;

//     return response.data;
//   };

//   // --------------------
//   // LOGOUT
//   // --------------------
//   const logout = async () => {
//     try {
//       await apiClient.post('/auth/logout');
//     } catch (_) {
//       // ignore server errors
//     } finally {
//       token.value = null;
//       user.value = null;

//       localStorage.removeItem('token');
//       localStorage.removeItem('user');

//       // 🔥 KILL AUTH HEADER (THIS FIXES YOUR BUG)
//       delete apiClient.defaults.headers.common.Authorization;

//       await router.replace('/login');
//     }
//   };

//   return {
//     token,
//     user,
//     isAuthenticated,
//     login,
//     logout
//   };
// });
