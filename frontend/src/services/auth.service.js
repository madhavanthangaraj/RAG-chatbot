import apiRequest from './api';

export const register = async ({ username, email, password, role }) => {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role })
  });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  return response.data;
};

export const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Error during backend logout, cleaning local storage anyway:', err);
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
