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

export type Persona = "consultant" | "customer";

const STORAGE_KEY = "ida.persona";
export const DEFAULT_PERSONA: Persona = "consultant";

export const PERSONA_LABELS: Record<Persona, string> = {
  consultant: "Consultant",
  customer: "Customer",
};

export function readStoredPersona(): Persona {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return v === "customer" ? "customer" : "consultant";
  } catch {
    return DEFAULT_PERSONA;
  }
}

/** Capabilities derived from the persona. The customer is read + report by
 *  default; governed actions (approvals/inputs) are layered on later, gated by
 *  the customer's engagement role — never operator tools. */
export interface PersonaCapabilities {
  /** Operator tools: upload/edit sites, issue LOAs, manage contracts, connectors,
   *  author assessments, publish. Consultant only. */
  canOperate: boolean;
  /** Sees the multi-project inventory (a consultant works across many projects). */
  canSeeAllProjects: boolean;
}

export function capabilitiesFor(persona: Persona): PersonaCapabilities {
  const isConsultant = persona === "consultant";
  return { canOperate: isConsultant, canSeeAllProjects: isConsultant };
}

const listeners = new Set<() => void>();
let current: Persona = readStoredPersona();

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot(): Persona { return current; }

export function setPersona(persona: Persona): void {
  current = persona;
  try { window.localStorage.setItem(STORAGE_KEY, persona); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** React hook: current persona, setter, and derived capabilities. */
export function usePersona(): { persona: Persona; setPersona: (p: Persona) => void; capabilities: PersonaCapabilities } {
  const persona = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PERSONA);
  const set = useCallback((p: Persona) => setPersona(p), []);
  return { persona, setPersona: set, capabilities: capabilitiesFor(persona) };
}
