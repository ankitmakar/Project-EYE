import { apiClient } from './client';
import { AuditLog } from '../types';

export interface AuditListResponse {
  total: number;
  limit: number;
  offset: number;
  items: AuditLog[];
}

export const auditApi = {
  getAuditLogs: async (params?: { action?: string; username?: string; limit?: number; offset?: number }): Promise<AuditListResponse> => {
    const res = await apiClient.get<AuditListResponse>('/audit-logs', { params });
    return res.data;
  },
};
