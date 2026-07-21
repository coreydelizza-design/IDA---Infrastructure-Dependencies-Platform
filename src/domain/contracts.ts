// Contract records — the consultant's contract/document repository. Master
// Service Agreements (and related instruments) with the enterprise client sit
// here; Letters of Authorization with carriers are tracked as authorizations
// (see authorization.ts) and surfaced alongside contracts in the repository.

export type ContractType = "msa" | "sow" | "nda" | "dpa" | "amendment";

export type ContractStatus = "draft" | "in-review" | "active" | "expiring" | "expired" | "terminated";

export interface Contract {
  id: string;
  enterpriseClientId: string;
  /** null = enterprise-level (e.g. the MSA); otherwise tied to one engagement. */
  engagementId: string | null;
  type: ContractType;
  title: string;
  reference: string;
  status: ContractStatus;
  counterparty: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  /** Human-readable document name/reference. Blob storage is a later concern. */
  documentName: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  msa: "MSA",
  sow: "SOW",
  nda: "NDA",
  dpa: "DPA",
  amendment: "Amendment",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  "in-review": "In Review",
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  terminated: "Terminated",
};

/** Status → tone bucket for pills. */
export function contractStatusTone(status: ContractStatus): "green" | "amber" | "red" | "slate" {
  switch (status) {
    case "active": return "green";
    case "expiring": case "in-review": case "draft": return "amber";
    case "expired": case "terminated": return "red";
    default: return "slate";
  }
}

export interface ContractSummary {
  total: number;
  activeMsaCount: number;
  expiringCount: number;
  draftCount: number;
}

export function summarizeContracts(contracts: Contract[]): ContractSummary {
  return {
    total: contracts.length,
    activeMsaCount: contracts.filter((c) => c.type === "msa" && c.status === "active").length,
    expiringCount: contracts.filter((c) => c.status === "expiring").length,
    draftCount: contracts.filter((c) => c.status === "draft" || c.status === "in-review").length,
  };
}
