export type DataGapType =
  | "missing-fact"
  | "unverified-fact"
  | "conflicting-claim"
  | "stale-evidence"
  | "carrier-confirmation-required"
  | "enterprise-confirmation-required"
  | "dependency-unknown"
  | "authorization-required";

export type DataGapStatus =
  | "open"
  | "enterprise-requested"
  | "carrier-requested"
  | "response-received"
  | "consultant-review"
  | "resolved"
  | "accepted-unknown"
  | "closed";

export type DataGapPriority = "low" | "medium" | "high" | "critical";

/** Who the consultant routes a gap to for resolution. */
export type DataGapRequestedFrom = "enterprise" | "carrier" | "consultant-research" | "none";

export interface DataGap {
  id: string;
  engagementId: string;
  siteId: string | null;
  entityType: string;
  entityId: string | null;
  fieldPath: string;
  title: string;
  description: string;
  gapType: DataGapType;
  priority: DataGapPriority;
  requestedFrom: DataGapRequestedFrom;
  requiresAuthorization: boolean;
  status: DataGapStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
