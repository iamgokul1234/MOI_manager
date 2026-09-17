import api from '@/lib/axios';
import type { ApiResponse, Person, PersonDetail } from '@/types';

export type PeopleSort = 'recent' | 'active' | 'name' | 'area' | 'received' | 'given';

export interface PeopleQuery {
  search?: string;
  area?: string;
  hasTransactions?: 'true' | 'false' | '';
  minReceived?: string;
  maxReceived?: string;
  minGiven?: string;
  maxGiven?: string;
  sort?: PeopleSort;
  page?: number;
  limit?: number;
}

export interface PersonInput {
  area: string;
  husbandName?: string;
  wifeName?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  notes?: string;
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

  create: async (data: PersonInput) => {
    const res = await api.post<ApiResponse<Person>>('/people', data);
    return res.data;
  },

  update: async (id: string, data: Partial<PersonInput>) => {
    const res = await api.patch<ApiResponse<Person>>(`/people/${id}`, data);
    return res.data;
  },

  /** Returns 409 with data.requiresConfirmation when the person has entries and confirm=false. */
  delete: async (id: string, confirm?: boolean) => {
    const res = await api.delete<ApiResponse<null>>(`/people/${id}`, {
      params: confirm ? { confirm: 'true' } : {},
    });
    return res.data;
  },

  checkDuplicate: async (params: {
    husbandName?: string;
    wifeName?: string;
    area?: string;
    excludeId?: string;
  }) => {
    const res = await api.get<ApiResponse<{ duplicates: Person[] }>>('/people/check-duplicate', {
      params,
    });
    return res.data;
  },

  getAreas: async () => {
    const res = await api.get<ApiResponse<string[]>>('/people/areas');
    return res.data;
  },
};
