import apiClient from './axios';

/**
 * Admin user management API service
 */

/**
 * Fetch all users with filters
 */
export const fetchUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

/**
 * Update a user
 */
export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/admin/users/${userId}`, userData);
  return response.data;
};

/**
 * Reset user password
 */
export const resetUserPassword = async (userId) => {
  const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
  return response.data;
};

