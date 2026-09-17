import api from '@/lib/axios';
import type {
  ApiResponse,
  FunctionCategory,
  FunctionEvent,
  FunctionDetail,
  FunctionPersonRow,
  TransactionType,
} from '@/types';

export interface FunctionsQuery {
  category?: FunctionCategory;
  search?: string;
  type?: string;
  upcoming?: 'true' | 'false';
  page?: number;
  limit?: number;
}

export interface FunctionInput {
  name: string;
  category: FunctionCategory;
  type: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface FunctionPeopleQuery {
  search?: string;
  area?: string;
  type?: TransactionType | '';
  attended?: 'true' | 'false' | '';
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

  /** PRIMARY VIEW for Our Functions: person + amount + type + attended, scoped to this function. */
  getPeople: async (id: string, query: FunctionPeopleQuery = {}) => {
    const params: Record<string, string> = {};
    if (query.search) params.search = query.search;
    if (query.area) params.area = query.area;
    if (query.type) params.type = query.type;
    if (query.attended) params.attended = query.attended;
    const res = await api.get<ApiResponse<FunctionPersonRow[]>>(`/functions/${id}/people`, {
      params,
    });
    return res.data;
  },

  create: async (data: FunctionInput) => {
    const res = await api.post<ApiResponse<FunctionEvent>>('/functions', data);
    return res.data;
  },

  update: async (id: string, data: Partial<FunctionInput>) => {
    const res = await api.patch<ApiResponse<FunctionEvent>>(`/functions/${id}`, data);
    return res.data;
  },

  /** Returns 409 with data.requiresConfirmation when the function has entries and confirm=false. */
  delete: async (id: string, confirm?: boolean) => {
    const res = await api.delete<ApiResponse<null>>(`/functions/${id}`, {
      params: confirm ? { confirm: 'true' } : {},
    });
    return res.data;
  },
};
