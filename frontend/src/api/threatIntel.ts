import { apiClient } from './client';

export interface IOCItem {
  indicator: string;
  type: string;
  reputation: string;
  score: number;
  threat_actor?: string;
  malware_family?: string;
  sources?: string[];
  confidence?: number;
}

export const threatIntelApi = {
  getIocs: async (): Promise<IOCItem[]> => {
    const res = await apiClient.get<IOCItem[]>('/threat-intel/iocs');
    return res.data;
  },
  enrichIoc: async (indicator: string): Promise<any> => {
    const res = await apiClient.get(`/threat-intel/enrich?indicator=${encodeURIComponent(indicator)}`);
    return res.data;
  },
  computeEvidenceHash: async (data: string): Promise<{ sha256: string; md5: string; byte_size: string; timestamp: string }> => {
    const res = await apiClient.post('/threat-intel/evidence/hash', { data });
    return res.data;
  },
};
