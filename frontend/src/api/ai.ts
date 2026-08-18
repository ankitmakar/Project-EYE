import { apiClient } from './client';
import { AIAnalysisResponse } from '../types';

export const aiApi = {
  analyzeAlert: async (alertId: string, contextNotes?: string): Promise<AIAnalysisResponse> => {
    const res = await apiClient.post<AIAnalysisResponse>('/ai/analyze-alert', {
      alert_id: alertId,
      context_notes: contextNotes,
    });
    return res.data;
  },
  investigateIncident: async (incidentId: string, focusArea?: string): Promise<AIAnalysisResponse> => {
    const res = await apiClient.post<AIAnalysisResponse>('/ai/investigate-incident', {
      incident_id: incidentId,
      focus_area: focusArea,
    });
    return res.data;
  },
};
