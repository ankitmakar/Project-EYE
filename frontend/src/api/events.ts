import { apiClient } from './client';
import { SecurityEvent, SOCMetrics } from '../types';

export interface EventListResponse {
  total: number;
  limit: number;
  offset: number;
  items: SecurityEvent[];
}

export const eventsApi = {
  getEvents: async (params?: {
    source?: string;
    host?: string;
    source_ip?: string;
    username?: string;
    event_type?: string;
    severity?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<EventListResponse> => {
    const res = await apiClient.get<EventListResponse>('/events', { params });
    return res.data;
  },
  getMetrics: async (): Promise<SOCMetrics> => {
    const res = await apiClient.get<SOCMetrics>('/events/stats');
    return res.data;
  },
  ingestLog: async (source: string, raw_log: string, host?: string): Promise<any> => {
    const res = await apiClient.post('/events/ingest', { source, raw_log, host });
    return res.data;
  }
};
