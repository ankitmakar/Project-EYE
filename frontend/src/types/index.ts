export type UserRole = 'admin' | 'soc_analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface SecurityEvent {
  id: string;
  event_id: string;
  timestamp: string;
  source: string;
  host: string;
  source_ip?: string;
  destination_ip?: string;
  username?: string;
  event_type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  raw_event: string;
  meta_info: Record<string, any>;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_id: string;
  rule_id: string;
  rule_name: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  source: string;
  host: string;
  source_ip?: string;
  username?: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  description?: string;
  evidence: Record<string, any>;
  analyst_notes?: string;
  assigned_to_id?: string;
  incident_id?: string;
  assigned_analyst?: User;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  incident_id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  lead_analyst_id?: string;
  timeline_summary?: string;
  ai_analysis: Record<string, any>;
  root_cause?: string;
  mitigation_steps: string[];
  analyst_notes?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  lead_analyst?: User;
  alerts_count?: number;
  alerts?: Alert[];
}

export interface DetectionRule {
  id: string;
  rule_id: string;
  name: string;
  description?: string;
  severity: string;
  confidence: number;
  enabled: boolean;
  version: string;
  category: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  yaml_content: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  username: string;
  ip_address?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  status: string;
}

export interface AIAnalysisResponse {
  summary: string;
  root_cause: string;
  mitre_mapping: string[];
  threat_hypothesis: string;
  recommended_actions: string[];
  confidence: number;
  prompt_shield_status: string;
  execution_time_ms: number;
  provider_used: string;
}

export interface SOCMetrics {
  total_events: number;
  total_alerts: number;
  open_incidents: number;
  severity_breakdown: Record<string, number>;
  source_breakdown: Record<string, number>;
}
