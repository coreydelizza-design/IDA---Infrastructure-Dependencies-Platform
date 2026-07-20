import type { FactVerificationState } from "./provenance";

export type DependencyState = "declared" | "claimed" | "confirmed" | "inferred" | "disputed" | "unknown";

export type DependencyType =
  | "physical-path"
  | "carrier"
  | "underlying-provider"
  | "facility"
  | "building-entrance"
  | "riser"
  | "shared-conduit"
  | "shared-pop"
  | "shared-router"
  | "shared-firewall"
  | "shared-switch"
  | "shared-power"
  | "shared-cloud-region"
  | "shared-availability-zone"
  | "shared-transit"
  | "shared-identity"
  | "shared-control-plane"
  | "business-service"
  | "contract"
  | "other";

/** Controlled 1..5 scales (labeled sliders in the intake UI). */
export type DependencyCriticality = 1 | 2 | 3 | 4 | 5;
export type Substitutability = 1 | 2 | 3 | 4 | 5;
export type FailureImpact = 1 | 2 | 3 | 4 | 5;

export interface Dependency {
  id: string;
  engagementId: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  dependencyType: DependencyType;
  state: DependencyState;
  criticality: DependencyCriticality;
  substitutability: Substitutability;
  failureImpact: FailureImpact;
  verificationState: FactVerificationState;
  evidenceItemIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
