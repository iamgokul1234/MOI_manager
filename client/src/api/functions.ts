import api from '@/lib/axios';
import type { ApiResponse, FunctionEvent, FunctionDetail } from '@/types';

export interface FunctionsQuery {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const functionsApi = {
  list: async (query: FunctionsQuery = {}) => {
    const res = await api.get<ApiResponse<FunctionEvent[]>>('/functions', { params: query });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<FunctionDetail>>(`/functions/${id}`);
    return res.data;
  },

  create: async (data: { name: string; type: string; date: string; location?: string; notes?: string }) => {
    const res = await api.post<ApiResponse<FunctionEvent>>('/functions', data);
    return res.data;
  },

  update: async (id: string, data: Partial<FunctionEvent>) => {
    const res = await api.patch<ApiResponse<FunctionEvent>>(`/functions/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/functions/${id}`);
    return res.data;
  },
};
