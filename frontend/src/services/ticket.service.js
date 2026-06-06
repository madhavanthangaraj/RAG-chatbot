import apiRequest from './api';

export const listTickets = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.priority) queryParams.append('priority', filters.priority);
  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
  
  const response = await apiRequest(`/tickets?${queryParams.toString()}`);
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await apiRequest(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async ({ subject, description, priority = 'medium', category = 'general' }) => {
  const response = await apiRequest('/tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, description, priority, category })
  });
  return response.data;
};

export const updateTicket = async (id, updates) => {
  const response = await apiRequest(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return response.data;
};

export const addComment = async (ticketId, comment) => {
  const response = await apiRequest(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
  return response;
};

export const deleteTicket = async (id) => {
  const response = await apiRequest(`/tickets/${id}`, {
    method: 'DELETE'
  });
  return response;
};

