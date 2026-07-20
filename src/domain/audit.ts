import type { EngagementRole } from "./engagements";

export type AuditAction =
  | "enterprise-created"
  | "engagement-created"
  | "engagement-switched"
  | "site-created"
  | "site-updated"
  | "site-archived"
  | "site-restored"
  | "provider-created"
  | "circuit-created"
  | "circuit-updated"
  | "dependency-created"
  | "dependency-updated"
  | "evidence-created"
  | "data-gap-created"
  | "data-gap-resolved"
  | "registry-state-changed"
  | "assessment-status-changed";

export interface AuditEvent {
  id: string;
  engagementId: string | null;
  actorUserId: string;
  actorRole: EngagementRole | "system";
  entityType: string;
  entityId: string;
  action: AuditAction;
  timestamp: string;
  beforeSummary: string | null;
  afterSummary: string | null;
  source: string;
}
