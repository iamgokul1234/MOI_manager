import api from '@/lib/axios';
import type { ApiResponse, DashboardData, ReportSummary, FunctionReport, AreaReport, YearlyReport } from '@/types';

export const dashboardApi = {
  get: async () => {
    const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return res.data;
  },
};

export const reportsApi = {
  summary: async () => {
    const res = await api.get<ApiResponse<ReportSummary>>('/reports/summary');
    return res.data;
  },

  functions: async () => {
    const res = await api.get<ApiResponse<FunctionReport[]>>('/reports/functions');
    return res.data;
  },

  areas: async () => {
    const res = await api.get<ApiResponse<AreaReport[]>>('/reports/areas');
    return res.data;
  },

  yearly: async (year?: string) => {
    const res = await api.get<ApiResponse<YearlyReport[]>>('/reports/yearly', {
      params: year ? { year } : {},
    });
    return res.data;
  },
};
