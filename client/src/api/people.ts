import api from '@/lib/axios';
import type { ApiResponse, Person, PersonDetail } from '@/types';

export interface PeopleQuery {
  search?: string;
  area?: string;
  hasTransactions?: string;
  minReceived?: string;
  maxReceived?: string;
  minGiven?: string;
  maxGiven?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const peopleApi = {
  list: async (query: PeopleQuery = {}) => {
    const res = await api.get<ApiResponse<Person[]>>('/people', { params: query });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<PersonDetail>>(`/people/${id}`);
    return res.data;
  },

  create: async (data: Omit<Person, '_id' | 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt'>) => {
    const res = await api.post<ApiResponse<Person>>('/people', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Person>) => {
    const res = await api.patch<ApiResponse<Person>>(`/people/${id}`, data);
    return res.data;
  },

  delete: async (id: string, confirm?: boolean) => {
    const res = await api.delete<ApiResponse<{ requiresConfirmation?: boolean; transactionCount?: number }>>(`/people/${id}`, {
      params: confirm ? { confirm: 'true' } : {},
    });
    return res.data;
  },

  checkDuplicate: async (params: { husbandName?: string; wifeName?: string; area?: string }) => {
    const res = await api.get<ApiResponse<{ duplicates: Person[] }>>('/people/check-duplicate', { params });
    return res.data;
  },

  getAreas: async () => {
    const res = await api.get<ApiResponse<string[]>>('/people/areas');
    return res.data;
  },
};
