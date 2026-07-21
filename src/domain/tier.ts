// Delivery tier (lite mode).
//
// A commercial/feature tier for a white-label deployment. "lite" presents the
// core registry over the SAME locked visual shell (see docs/UI_LOCK.md) and
// hides advanced workspaces; it never forks the domain model, scoring, or the
// locked hero. Tier is per-enterprise and defaults to "full", so the seeded
// enterprise — and therefore the approved baseline render — is unchanged.

export type DeliveryTier = "full" | "lite";

export const DEFAULT_TIER: DeliveryTier = "full";

export const TIER_LABELS: Record<DeliveryTier, string> = {
  full: "Full",
  lite: "Lite",
};

export const TIER_DESCRIPTIONS: Record<DeliveryTier, string> = {
  full: "Complete assurance platform — assessments, carrier collaboration, connectors, compliance mapping, and regulatory export.",
  lite: "Core registry only — the site inventory, dependencies, risk register, and requirements. Advanced workspaces are hidden.",
};

/**
 * Workspace routes hidden in lite mode. Values are WorkspacePage string keys,
 * kept as a plain string set so the domain stays decoupled from the app router.
 * Everything not listed here (including the locked Site Inventory and the
 * Administration surface that toggles the tier) is available in every tier.
 */
export const FULL_ONLY_PAGES: ReadonlySet<string> = new Set<string>([
  "assessments",
  "compliance",
  "dora",
  "ict",
  "scenarios",
  "tests",
  "remediation",
  "loa",
  "carrier-engagements",
  "documents",
  "reports",
  "audit",
]);

export function resolveTier(tier: DeliveryTier | null | undefined): DeliveryTier {
  return tier === "lite" ? "lite" : DEFAULT_TIER;
}

/** True when a workspace route is reachable under the given tier. */
export function isPageAvailable(page: string, tier: DeliveryTier): boolean {
  return tier === "full" || !FULL_ONLY_PAGES.has(page);
}

/** True when the route exists but is gated behind the full tier. */
export function isPageGated(page: string, tier: DeliveryTier): boolean {
  return tier === "lite" && FULL_ONLY_PAGES.has(page);
}
