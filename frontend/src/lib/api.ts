import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

// Auth
export const getMe = () => api.get('/api/auth/me');
export const login = (email: string, password: string) => api.post('/api/auth/login', { email, password });
export const register = (name: string, email: string, password: string) => api.post('/api/auth/register', { name, email, password });
export const logout = () => api.post('/api/auth/logout');

// Chats
export const getChats = () => api.get('/api/chats');
export const createChat = (title?: string, mode?: string) => api.post('/api/chats', { title, mode });
export const getChat = (id: string) => api.get(`/api/chats/${id}`);
export const updateChat = (id: string, data: object) => api.patch(`/api/chats/${id}`, data);
export const deleteChat = (id: string) => api.delete(`/api/chats/${id}`);
export const addMessage = (chatId: string, role: string, content: string) =>
  api.post(`/api/chats/${chatId}/messages`, { role, content });

// AI
export const sendAIMessage = (messages: object[], detailLevel?: string, mode?: string) =>
  api.post('/api/ai/chat', { messages, detailLevel, mode });

// Notes
export const getNotes = () => api.get('/api/notes');
export const createNote = (title: string, content: string, tags?: string[]) =>
  api.post('/api/notes', { title, content, tags });
export const deleteNote = (id: string) => api.delete(`/api/notes/${id}`);

// Export
export const exportChatPDF = (chatId: string) =>
  api.get(`/api/export/chat/${chatId}/pdf`, { responseType: 'blob' });

// Admin
export const getAdminStats = () => api.get('/api/admin/stats');
export const getAdminUsers = () => api.get('/api/admin/users');

export default api;
