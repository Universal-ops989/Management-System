import apiClient from './axios';

/**
 * Fetch all users (for filters)
 */
export const fetchUsers = async ({ limit = 1000 } = {}) => {
  const response = await apiClient.get('/admin/users', {
    params: { limit }
  });

  return response.data;
};