// Foundational authorization records only. The full LOA/carrier workflow is a
// later phase. Enterprise authorization and carrier acknowledgment remain
// separate states.

export type AuthorizationStatus =
  | "not-requested"
  | "drafting"
  | "pending-enterprise-signature"
  | "active"
  | "expired"
  | "revoked";

export type CarrierAcknowledgmentStatus =
  | "not-submitted"
  | "submitted"
  | "accepted"
  | "rejected"
  | "alternate-form-required"
  | "expired";

export interface EnterpriseAuthorizationSummary {
  id: string;
  engagementId: string;
  enterpriseClientId: string;
  status: AuthorizationStatus;
  scopeSummary: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  carrierIds: string[];
  siteIds: string[];
}

export interface CarrierAcknowledgmentSummary {
  id: string;
  authorizationId: string;
  carrierId: string;
  status: CarrierAcknowledgmentStatus;
  receivedAt: string | null;
  notes: string;
}

/** Enterprise authorization being active is independent of carrier acknowledgment. */
export function isAuthorizationActive(auth: EnterpriseAuthorizationSummary): boolean {
  return auth.status === "active";
}
