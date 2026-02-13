import apiClient from './axios';

/**
 * Fetch all users (for filters)
 *
 * NOTE: This helper intentionally normalizes the response shape so that
 * existing callers using either `res.users` or `res.data.users` will
 * continue to work.
 *
 * Backend response shape (from /admin/users):
 *   {
 *     ok: true,
 *     data: {
 *       users: [...],
 *       pagination: {...}
 *     }
 *   }
 *
 * This function returns an object that:
 *   - keeps the original fields (ok, data, message, etc.)
 *   - adds top‑level `users` and `pagination` for callers using `res.users`
 *   - ensures `data.users` and `data.pagination` are always populated
 */
export const fetchUsers = async (params = { limit: 1000 }) => {
  const response = await apiClient.get('/admin/users', { params });

  const raw = response.data || {};
  const inner = raw.data || {};

  const users = inner.users || raw.users || [];
  const pagination = inner.pagination || raw.pagination || null;

  return {
    ...raw,
    users,
    pagination,
    data: {
      ...inner,
      users,
      pagination,
    },
  };
};