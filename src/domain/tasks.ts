export type TaskStatus = "open" | "in-progress" | "blocked" | "done" | "cancelled";
export type TaskKind =
  | "enterprise-follow-up"
  | "carrier-confirmation"
  | "consultant-research"
  | "evidence-review"
  | "reconciliation"
  | "review";

export interface RegistryTask {
  id: string;
  engagementId: string;
  siteId: string | null;
  kind: TaskKind;
  title: string;
  description: string;
  assigneeUserId: string | null;
  status: TaskStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}
