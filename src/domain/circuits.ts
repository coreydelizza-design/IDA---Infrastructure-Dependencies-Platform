import type { FactVerificationState } from "./provenance";

export type CircuitRole = "primary" | "secondary" | "tertiary" | "backup" | "temporary";

export type CircuitServiceType =
  | "DIA"
  | "broadband"
  | "carrier-ethernet"
  | "MPLS-IPVPN"
  | "wavelength"
  | "dark-fiber"
  | "fixed-wireless"
  | "LTE"
  | "5G"
  | "satellite"
  | "cloud-interconnect"
  | "internet-VPN"
  | "private-WAN"
  | "other";

export type PhysicalMedium =
  | "single-mode-fiber"
  | "multimode-fiber"
  | "copper"
  | "coax"
  | "microwave"
  | "fixed-wireless"
  | "cellular"
  | "satellite"
  | "unknown";

export interface Circuit {
  id: string;
  engagementId: string;
  siteId: string;
  role: CircuitRole;
  serviceType: CircuitServiceType;
  serviceIdentifier: string | null;
  contractedProviderId: string | null;
  underlyingProviderId: string | null;
  accessProviderId: string | null;
  bandwidthValue: number | null;
  bandwidthUnit: "Mbps" | "Gbps" | null;
  committedRateValue: number | null;
  committedRateUnit: "Mbps" | "Gbps" | null;
  physicalMedium: PhysicalMedium;
  handoffType: string | null;
  demarcation: string | null;
  buildingEntrance: string | null;
  riser: string | null;
  carrierPop: string | null;
  routingType: string | null;
  ipAddressingSummary: string | null;
  sdwanMembership: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  slaAvailability: string | null;
  verificationState: FactVerificationState;
  evidenceItemIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
