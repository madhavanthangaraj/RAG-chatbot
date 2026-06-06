import apiRequest from './api';

export const getDashboardData = async () => {
  const response = await apiRequest('/analytics/dashboard');
  return response.data;
};
