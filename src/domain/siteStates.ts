// Shared site lifecycle states (leaf module to avoid import cycles). These are
// registry/assessment lifecycle states — never operational up/down states.

export type RegistryState =
  | "draft"
  | "enterprise-declared"
  | "consultant-review"
  | "enterprise-confirmation-pending"
  | "carrier-confirmation-pending"
  | "partially-confirmed"
  | "carrier-confirmed"
  | "consultant-verified"
  | "disputed"
  | "review-due"
  | "stale"
  | "archived";

export type AssessmentStatus =
  | "not-started"
  | "data-collection"
  | "awaiting-enterprise"
  | "awaiting-carrier"
  | "consultant-review"
  | "provisional"
  | "published"
  | "review-due"
  | "superseded";

const OPERATIONAL_TERMS = ["up", "down", "online", "offline", "degraded", "alarm", "outage"];

/** Proves a registry state is not an operational up/down/health state. */
export function isOperationalStateTerm(value: string): boolean {
  return OPERATIONAL_TERMS.includes(value.toLowerCase());
}

export const registryStateLabels: Record<RegistryState, string> = {
  draft: "Draft",
  "enterprise-declared": "Enterprise Declared",
  "consultant-review": "Consultant Review",
  "enterprise-confirmation-pending": "Enterprise Confirmation Pending",
  "carrier-confirmation-pending": "Carrier Confirmation Pending",
  "partially-confirmed": "Partially Confirmed",
  "carrier-confirmed": "Carrier Confirmed",
  "consultant-verified": "Consultant Verified",
  disputed: "Disputed",
  "review-due": "Review Due",
  stale: "Stale",
  archived: "Archived",
};
