import type { FactVerificationState } from "./provenance";

export type EvidenceType =
  | "contract"
  | "loa"
  | "cfa"
  | "carrier-letter"
  | "circuit-record"
  | "network-diagram"
  | "cmdb-export"
  | "cloud-inventory"
  | "invoice"
  | "email-confirmation"
  | "photo"
  | "other";

export interface EvidenceItem {
  id: string;
  engagementId: string;
  siteId: string | null;
  evidenceType: EvidenceType;
  title: string;
  source: string;
  documentDate: string | null;
  receivedDate: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  verificationState: FactVerificationState;
  /** Attachment storage is deferred; this holds a reference/URL when available. */
  attachmentRef: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
