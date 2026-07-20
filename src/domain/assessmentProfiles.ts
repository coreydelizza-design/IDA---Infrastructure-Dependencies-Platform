import type { AssessmentProfile, ControlDefinition } from "./assessment";

// Versioned assessment profiles per archetype. Control weights sum to 100.
// Archetypes that require path diversity apply a critical cap on the
// connectivity-diversity control; archetypes with an approved single-site
// pattern do not penalize it (handled by the engine's single-site exception).

const PROFILE_VERSION = "2026.1";

const BASE_CONTROLS: ControlDefinition[] = [
  { id: "connectivity-diversity", label: "Connectivity Diversity", weight: 25, category: "connectivity", isConnectivityDiversity: true, requiresEvidence: true },
  { id: "power-resilience", label: "Power Resilience", weight: 20, category: "power", requiresEvidence: true },
  { id: "facility-resilience", label: "Facility Resilience", weight: 15, category: "facility", requiresEvidence: true },
  { id: "environmental-controls", label: "Environmental Controls", weight: 10, category: "environment", requiresEvidence: false },
  { id: "physical-security", label: "Physical Security", weight: 8, category: "security", requiresEvidence: false },
  { id: "workforce-availability", label: "Workforce Availability", weight: 7, category: "workforce", requiresEvidence: false },
  { id: "cyber-resilience", label: "Cyber Resilience", weight: 10, category: "cyber", requiresEvidence: true },
  { id: "backup-recovery", label: "Backup & Recovery", weight: 5, category: "recovery", requiresEvidence: true },
];

const DIVERSITY_REQUIRED = new Set(["Primary Data Center", "Secondary Data Center", "Network Hub", "Financial Trading Floor", "Contact Center"]);
const SINGLE_SITE_ACCEPTABLE = new Set(["Branch Office", "Regional Office", "Edge Site", "Warehouse", "Manufacturing Site", "Cloud Region"]);

export function getAssessmentProfile(archetype: string): AssessmentProfile {
  const requiresDiversity = DIVERSITY_REQUIRED.has(archetype);
  const acceptableSingle = SINGLE_SITE_ACCEPTABLE.has(archetype);
  const controls = BASE_CONTROLS.map((control) =>
    control.isConnectivityDiversity && requiresDiversity ? { ...control, capScore: 69 } : { ...control },
  );
  return {
    id: `profile-${archetype.toLowerCase().replaceAll(" ", "-")}`,
    archetype,
    version: PROFILE_VERSION,
    redundancyExpectation: requiresDiversity ? "required" : acceptableSingle ? "acceptable-single" : "not-applicable",
    controls,
  };
}

export const ASSESSMENT_PROFILE_VERSION = PROFILE_VERSION;
