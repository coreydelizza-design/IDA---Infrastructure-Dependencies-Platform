// Consultancy and enterprise organization aggregates.

export type ConsultancyOrganizationStatus = "active" | "suspended" | "archived";

export interface ConsultancyOrganization {
  id: string;
  name: string;
  legalName: string;
  status: ConsultancyOrganizationStatus;
  primaryContactId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EnterpriseClientStatus = "prospect" | "active" | "on-hold" | "archived";

export interface EnterpriseClient {
  id: string;
  consultancyOrganizationId: string;
  name: string;
  legalName: string;
  industry: string;
  headquartersCountry: string;
  status: EnterpriseClientStatus;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
}
