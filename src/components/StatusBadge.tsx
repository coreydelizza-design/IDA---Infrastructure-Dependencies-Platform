import { CheckCircle2, CircleDot, Info, ShieldCheck } from "lucide-react";
import type { EvidenceBadge } from "../domain/models";

const LABELS: Record<Exclude<EvidenceBadge, null>, string> = {
  "evidence-verified": "Evidence verified",
  "provider-claimed-diverse": "Provider-claimed diverse",
  "under-carrier-review": "Under carrier review",
  "single-site-acceptable": "Single-site acceptable",
  "risk-accepted": "Risk accepted",
};

export function StatusBadge({ status }: { status: EvidenceBadge }) {
  if (!status) return <span className="evidence-badge-spacer" aria-hidden="true" />;
  const Icon = status === "evidence-verified" ? CheckCircle2 : status === "risk-accepted" ? ShieldCheck : status === "single-site-acceptable" ? Info : CircleDot;
  return (
    <span className={`evidence-badge evidence-${status}`}>
      <Icon size={10} strokeWidth={2.2} />
      {LABELS[status]}
    </span>
  );
}
