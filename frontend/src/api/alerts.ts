import { apiClient } from './client';
import { Alert, Incident } from '../types';

export interface AlertListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Alert[];
}

export const alertsApi = {
  getAlerts: async (params?: { status?: string; severity?: string; host?: string; limit?: number; offset?: number }): Promise<AlertListResponse> => {
    const res = await apiClient.get<AlertListResponse>('/alerts', { params });
    return res.data;
  },
  getAlert: async (alertId: string): Promise<Alert> => {
    const res = await apiClient.get<Alert>(`/alerts/${alertId}`);
    return res.data;
  },
  updateAlert: async (alertId: string, data: { status?: string; analyst_notes?: string; assigned_to_id?: string; severity?: string }): Promise<Alert> => {
    const res = await apiClient.patch<Alert>(`/alerts/${alertId}`, data);
    return res.data;
  },
  escalateAlert: async (alertId: string, data: { incident_id?: string; title?: string; severity?: string; analyst_notes?: string }): Promise<Incident> => {
    const res = await apiClient.post<Incident>(`/alerts/${alertId}/escalate`, data);
    return res.data;
  }
};
