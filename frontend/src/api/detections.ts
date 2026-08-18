import { apiClient } from './client';
import { DetectionRule } from '../types';

export const detectionsApi = {
  getRules: async (): Promise<DetectionRule[]> => {
    const res = await apiClient.get<DetectionRule[]>('/detections/rules');
    return res.data;
  },
  toggleRule: async (ruleId: string): Promise<DetectionRule> => {
    const res = await apiClient.patch<DetectionRule>(`/detections/rules/${ruleId}/toggle`);
    return res.data;
  },
  createRule: async (rule: Partial<DetectionRule>): Promise<DetectionRule> => {
    const res = await apiClient.post<DetectionRule>('/detections/rules', rule);
    return res.data;
  },
  testRule: async (yaml_content: string, sample_logs: string[]): Promise<any> => {
    const res = await apiClient.post('/detections/test', { yaml_content, sample_logs });
    return res.data;
  }
};
