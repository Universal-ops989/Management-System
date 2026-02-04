import { computed } from 'vue';
import { useStore } from 'vuex';

/**
 * Composable to access Vuex auth store
 * Provides same API as Pinia useAuthStore for easier migration
 */
export const useAuthStore = () => {
  const store = useStore();
  
  return {
    get token() {
      return store.getters['auth/token'];
    },
    get user() {
      return store.getters['auth/user'];
    },
    get isAuthenticated() {
      return store.getters['auth/isAuthenticated'];
    },
    login: (email, password) => store.dispatch('auth/login', { email, password }),
    logout: () => store.dispatch('auth/logout'),
    restoreAuth: () => store.dispatch('auth/restoreAuth')
  };
};
