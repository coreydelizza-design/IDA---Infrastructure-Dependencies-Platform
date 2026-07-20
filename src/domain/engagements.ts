// Engagement aggregate — a consultant's scoped body of work for one enterprise.

export type EngagementStatus =
  | "draft"
  | "scoping"
  | "data-collection"
  | "enterprise-validation"
  | "carrier-confirmation"
  | "consultant-reconciliation"
  | "assessment"
  | "published"
  | "periodic-review"
  | "closed"
  | "archived";

export type EngagementRole =
  | "consultancy-admin"
  | "engagement-lead"
  | "consultant"
  | "network-architect"
  | "evidence-reviewer"
  | "compliance-analyst"
  | "enterprise-sponsor"
  | "enterprise-contributor"
  | "enterprise-approver"
  | "carrier-respondent"
  | "carrier-reviewer"
  | "read-only-reviewer";

export type EngagementMemberStatus = "active" | "invited" | "inactive";

export interface Engagement {
  id: string;
  consultancyOrganizationId: string;
  enterpriseClientId: string;
  name: string;
  code: string;
  description: string;
  status: EngagementStatus;
  scopeStatement: string;
  startDate: string | null;
  targetCompletionDate: string | null;
  reviewCadence: string;
  leadConsultantUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementMember {
  id: string;
  engagementId: string;
  userId: string;
  role: EngagementRole;
  status: EngagementMemberStatus;
  joinedAt: string;
}
