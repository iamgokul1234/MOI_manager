import api from '@/lib/axios';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<User>>('/auth/login', data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },

  me: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};
