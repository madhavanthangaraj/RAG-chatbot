import apiRequest from './api';

export const listArticles = async () => {
  const response = await apiRequest('/kb/articles');
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await apiRequest(`/kb/articles/${id}`);
  return response.data;
};

export const createArticle = async ({ title, content }) => {
  const response = await apiRequest('/kb/articles', {
    method: 'POST',
    body: JSON.stringify({ title, content })
  });
  return response.data;
};

export const updateArticle = async (id, { title, content }) => {
  const response = await apiRequest(`/kb/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content })
  });
  return response.data;
};

export const deleteArticle = async (id) => {
  await apiRequest(`/kb/articles/${id}`, {
    method: 'DELETE'
  });
};

export const getVersions = async (id) => {
  const response = await apiRequest(`/kb/articles/${id}/versions`);
  return response.data;
};

export const rollbackVersion = async (id, version) => {
  const response = await apiRequest(`/kb/articles/${id}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ version })
  });
  return response.data;
};

export const uploadFile = async (file) => {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:5000/api/kb/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'File sync failed.');
  }

  return await response.json();
};
