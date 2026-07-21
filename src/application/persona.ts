// Persona (who is using the portal).
//
// The platform serves two audiences over one registry:
//  - "consultant" — the operator. Runs engagements, uploads sites, issues and
//    maintains LOAs/contracts, reconciles connector data, authors assessments,
//    and publishes. Sees the Project Inventory (all projects) as their home.
//  - "customer" — the enterprise. A read-and-report experience scoped to their
//    engagement: dashboard, registry, reports. Never operates the registry;
//    governed actions (approvals, risk acceptance, data contributions) are
//    role-gated and flow through consultant reconciliation — never direct edits
//    to canonical facts.
//
// There is no auth yet, so persona is a per-viewer setting (localStorage) with a
// "View as" switch, defaulting to consultant. When auth arrives, persona derives
// from the signed-in user's engagement role instead.

import { useCallback, useSyncExternalStore } from "react";
import type { CustomerRole } from "../domain";

export type Persona = "consultant" | "customer";
export type { CustomerRole };

const STORAGE_KEY = "ida.persona";
const ROLE_KEY = "ida.customerRole";
export const DEFAULT_PERSONA: Persona = "consultant";
export const DEFAULT_CUSTOMER_ROLE: CustomerRole = "enterprise-sponsor";

export const PERSONA_LABELS: Record<Persona, string> = {
  consultant: "Consultant",
  customer: "Customer",
};

export const CUSTOMER_ROLE_LABELS: Record<CustomerRole, string> = {
  "enterprise-sponsor": "Sponsor",
  "enterprise-approver": "Approver",
  "enterprise-contributor": "Contributor",
  "read-only-reviewer": "Reviewer",
};

const CUSTOMER_ROLES: CustomerRole[] = ["enterprise-sponsor", "enterprise-approver", "enterprise-contributor", "read-only-reviewer"];

export function readStoredPersona(): Persona {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return v === "customer" ? "customer" : "consultant";
  } catch {
    return DEFAULT_PERSONA;
  }
}

export function readStoredCustomerRole(): CustomerRole {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(ROLE_KEY) : null;
    return v && (CUSTOMER_ROLES as string[]).includes(v) ? (v as CustomerRole) : DEFAULT_CUSTOMER_ROLE;
  } catch {
    return DEFAULT_CUSTOMER_ROLE;
  }
}

/** Capabilities derived from the persona (+ the customer's engagement role).
 *  The customer is read + report by default; governed actions are role-gated and
 *  flow through consultant reconciliation — never operator tools or direct edits. */
export interface PersonaCapabilities {
  /** Operator tools: upload/edit sites, issue LOAs, manage contracts, connectors,
   *  author assessments, publish. Consultant only. */
  canOperate: boolean;
  /** Sees the multi-project inventory (a consultant works across many projects). */
  canSeeAllProjects: boolean;
  /** Governed approvals: sign LOAs, accept risk, validate findings. Enterprise
   *  sponsor/approver only. Records a decision for consultant reconciliation. */
  canApprove: boolean;
  /** Governed inputs: respond to data-gap requests, comment. Contributor and up. */
  canContribute: boolean;
}

export function capabilitiesFor(persona: Persona, customerRole: CustomerRole = DEFAULT_CUSTOMER_ROLE): PersonaCapabilities {
  const isConsultant = persona === "consultant";
  const isCustomer = persona === "customer";
  const canApprove = isCustomer && (customerRole === "enterprise-sponsor" || customerRole === "enterprise-approver");
  const canContribute = isCustomer && customerRole !== "read-only-reviewer";
  return { canOperate: isConsultant, canSeeAllProjects: isConsultant, canApprove, canContribute };
}

const listeners = new Set<() => void>();
let currentPersona: Persona = readStoredPersona();
let currentRole: CustomerRole = readStoredCustomerRole();

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function emit() { listeners.forEach((l) => l()); }
// Snapshot must be a stable reference between renders (useSyncExternalStore).
let snapshot = { persona: currentPersona, customerRole: currentRole };
function getSnapshot() { return snapshot; }

export function setPersona(persona: Persona): void {
  currentPersona = persona;
  snapshot = { persona: currentPersona, customerRole: currentRole };
  try { window.localStorage.setItem(STORAGE_KEY, persona); } catch { /* ignore */ }
  emit();
}

export function setCustomerRole(role: CustomerRole): void {
  currentRole = role;
  snapshot = { persona: currentPersona, customerRole: currentRole };
  try { window.localStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
  emit();
}

/** React hook: current persona + customer role, setters, and derived capabilities. */
export function usePersona(): {
  persona: Persona;
  customerRole: CustomerRole;
  setPersona: (p: Persona) => void;
  setCustomerRole: (r: CustomerRole) => void;
  capabilities: PersonaCapabilities;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => snapshot);
  const setP = useCallback((p: Persona) => setPersona(p), []);
  const setR = useCallback((r: CustomerRole) => setCustomerRole(r), []);
  return { persona: state.persona, customerRole: state.customerRole, setPersona: setP, setCustomerRole: setR, capabilities: capabilitiesFor(state.persona, state.customerRole) };
}
