import type { EngagementRole } from "./engagements";

export type ContactStatus = "active" | "inactive";

export interface EnterpriseContact {
  id: string;
  enterpriseClientId: string;
  engagementId: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  responsibility: string;
  approvalAuthority: boolean;
  role: EngagementRole;
  status: ContactStatus;
}
