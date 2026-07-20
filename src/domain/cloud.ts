import type { FactVerificationState } from "./provenance";

export type CloudResourceType =
  | "cloud-region"
  | "availability-zone"
  | "VPC"
  | "VNet"
  | "VCN"
  | "subnet"
  | "route-table"
  | "transit-gateway"
  | "VPN-gateway"
  | "NAT-gateway"
  | "firewall"
  | "cloud-interconnect";

export interface CloudResource {
  id: string;
  engagementId: string;
  siteId: string;
  cloudProvider: string;
  resourceType: CloudResourceType;
  resourceIdentifier: string | null;
  region: string | null;
  availabilityZone: string | null;
  verificationState: FactVerificationState;
  evidenceItemIds: string[];
  createdAt: string;
  updatedAt: string;
}
