import type { FactVerificationState } from "./provenance";

export type ServiceCriticality = "supporting" | "important" | "critical" | "essential" | "safety-critical";

/** Documented assurance posture of a critical service. Never a live up/down state. */
export type ServiceAssuranceState =
  | "not-assessed"
  | "partially-documented"
  | "documented"
  | "confirmation-pending"
  | "confirmed"
  | "consultant-verified"
  | "disputed"
  | "review-due";

export interface CriticalService {
  id: string;
  enterpriseClientId: string;
  engagementId: string;
  name: string;
  description: string;
  serviceOwnerContactId: string | null;
  businessFunction: string;
  criticality: ServiceCriticality;
  operationalDependency: number;
  rtoMinutes: number | null;
  rpoMinutes: number | null;
  maximumTolerableOutageMinutes: number | null;
  serviceTier: string;
  assuranceState: ServiceAssuranceState;
  verificationState: FactVerificationState;
  evidenceItemIds: string[];
  createdAt: string;
  updatedAt: string;
}
