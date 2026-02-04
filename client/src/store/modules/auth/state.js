// Restore from localStorage on initialization
const storedToken = localStorage.getItem('token') || null;
const storedUserStr = localStorage.getItem('user');
const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

export default {
  token: storedToken,
  user: storedUser
};
