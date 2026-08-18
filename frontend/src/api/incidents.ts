import { apiClient } from './client';
import { Incident } from '../types';

export interface IncidentListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Incident[];
}

export const incidentsApi = {
  getIncidents: async (params?: { status?: string; severity?: string; limit?: number; offset?: number }): Promise<IncidentListResponse> => {
    const res = await apiClient.get<IncidentListResponse>('/incidents', { params });
    return res.data;
  },
  getIncident: async (incidentId: string): Promise<Incident> => {
    const res = await apiClient.get<Incident>(`/incidents/${incidentId}`);
    return res.data;
  },
  createIncident: async (data: Partial<Incident> & { alert_ids?: string[] }): Promise<Incident> => {
    const res = await apiClient.post<Incident>('/incidents', data);
    return res.data;
  },
  updateIncident: async (incidentId: string, data: Partial<Incident>): Promise<Incident> => {
    const res = await apiClient.patch<Incident>(`/incidents/${incidentId}`, data);
    return res.data;
  },
  addNote: async (incidentId: string, note: string): Promise<Incident> => {
    const res = await apiClient.post<Incident>(`/incidents/${incidentId}/notes`, { note });
    return res.data;
  }
};
