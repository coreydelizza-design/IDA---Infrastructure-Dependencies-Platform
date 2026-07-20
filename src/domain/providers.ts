import type { FactVerificationState } from "./provenance";

export type ProviderType =
  | "contracted-carrier"
  | "underlying-carrier"
  | "local-access-provider"
  | "managed-service-provider"
  | "cloud-provider"
  | "colocation-provider"
  | "interconnection-provider"
  | "wireless-provider"
  | "satellite-provider"
  | "other-provider";

export interface Provider {
  id: string;
  tenantId: string;
  enterpriseClientId: string;
  name: string;
  legalName: string;
  providerType: ProviderType;
  identifiers: string[];
  accountNumbers: string[];
  primaryContact: string | null;
  verificationState: FactVerificationState;
  createdAt: string;
  updatedAt: string;
}
