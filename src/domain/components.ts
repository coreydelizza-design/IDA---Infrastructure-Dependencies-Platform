import type { FactVerificationState } from "./provenance";

export type ComponentType =
  | "facility"
  | "rack"
  | "chassis"
  | "router"
  | "firewall"
  | "switch"
  | "SD-WAN-edge"
  | "wireless-controller"
  | "wireless-access-point"
  | "modem"
  | "transceiver"
  | "physical-port"
  | "VLAN"
  | "VRF"
  | "subnet"
  | "route-table"
  | "VPN-gateway"
  | "NAT-gateway"
  | "transit-gateway"
  | "VPC"
  | "VNet"
  | "VCN"
  | "cloud-region"
  | "availability-zone"
  | "cloud-interconnect"
  | "power-feed"
  | "UPS"
  | "generator"
  | "cooling"
  | "other";

export type ComponentLayer = "L1" | "L2" | "L3" | "cloud" | "facility" | "power" | "control-plane" | "adjacent";

export type LifecycleState = "planned" | "active" | "maintenance" | "end-of-life" | "retired" | "unknown";

export type RedundancyRole = "standalone" | "primary" | "secondary" | "active-active" | "active-passive" | "spare" | "unknown";

export interface InfrastructureComponent {
  id: string;
  engagementId: string;
  siteId: string;
  componentType: ComponentType;
  layer: ComponentLayer;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  cloudResourceId: string | null;
  managementDomain: string | null;
  redundancyRole: RedundancyRole;
  highAvailabilityPartnerId: string | null;
  lifecycleState: LifecycleState;
  verificationState: FactVerificationState;
  evidenceItemIds: string[];
  createdAt: string;
  updatedAt: string;
}
