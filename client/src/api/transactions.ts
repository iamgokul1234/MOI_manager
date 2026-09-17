import api from '@/lib/axios';
import type { ApiResponse, Transaction, TransactionType } from '@/types';

export interface TransactionsQuery {
  personId?: string;
  functionId?: string;
  type?: TransactionType;
  area?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export const transactionsApi = {
  list: async (query: TransactionsQuery = {}) => {
    const res = await api.get<ApiResponse<Transaction[]>>('/transactions', { params: query });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: {
    personId: string;
    functionId: string;
    type: TransactionType;
    amount: number;
    transactionDate: string;
    notes?: string;
  }) => {
    const res = await api.post<ApiResponse<Transaction>>('/transactions', data);
    return res.data;
  },

  update: async (
    id: string,
    data: { type?: TransactionType; amount?: number; transactionDate?: string; notes?: string }
  ) => {
    const res = await api.patch<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return res.data;
  },
};
