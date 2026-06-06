import apiRequest from './api';

export const sendMessage = async (message, conversationId = null) => {
  const response = await apiRequest('/chat/message', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId })
  });
  return response.data;
};

export const getHistory = async (conversationId) => {
  const response = await apiRequest(`/chat/history?conversationId=${conversationId}`);
  return response.data;
};

export const listConversations = async () => {
  const response = await apiRequest('/chat/conversations');
  return response.data;
};

export const submitFeedback = async (messageId, rating, comment = '') => {
  const response = await apiRequest(`/chat/messages/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  });
  return response;
};

export const deleteConversation = async (conversationId) => {
  const response = await apiRequest(`/chat/conversations/${conversationId}`, {
    method: 'DELETE'
  });
  return response;
};

export const clearAllHistory = async () => {
  const response = await apiRequest('/chat/conversations', {
    method: 'DELETE'
  });
  return response;
};
