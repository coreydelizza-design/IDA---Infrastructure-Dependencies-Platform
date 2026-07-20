import { useCallback, useEffect, useState } from "react";
import { useRegistry } from "./registryContext";
import {
  CONNECTORS,
  classifyClaim,
  getConnector,
  reconcileClaim,
  type AuditEvent,
  type ConnectorKind,
  type ImportBatch,
  type ProposedClaim,
  type ReconciliationAction,
} from "../domain";

function audit(engagementId: string, entityId: string, action: AuditEvent["action"], after: string): AuditEvent {
  return { id: `audit-${action}-${entityId}-${Date.now()}`, engagementId, actorUserId: "user-consultant-1", actorRole: "consultant", entityType: "connector", entityId, action, timestamp: new Date().toISOString(), beforeSummary: null, afterSummary: after, source: "connector" };
}

export function useConnectors() {
  const registry = useRegistry();
  const engagementId = registry.currentEngagement?.id ?? "";
  const { repositories } = registry;

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [claims, setClaims] = useState<ProposedClaim[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!engagementId) return;
    const [b, c] = await Promise.all([
      repositories.connectors.listBatches(engagementId),
      repositories.connectors.listClaims(engagementId),
    ]);
    if (b.ok) setBatches(b.value);
    if (c.ok) setClaims(c.value);
  }, [repositories, engagementId]);

  useEffect(() => { void reload(); }, [reload]);

  const runImport = useCallback(
    async (kind: ConnectorKind, payload: string) => {
      const connector = getConnector(kind);
      if (!connector || !engagementId || busy) return;
      setBusy(true);
      try {
        const batchId = `batch-${kind}-${Date.now()}`;
        const receivedAt = new Date().toISOString();
        const parsed = connector.parse({ batchId, engagementId, sourceName: connector.descriptor.label, receivedAt, payload });
        // Classify each claim against existing consultant-verified provenance.
        const classified: ProposedClaim[] = [];
        for (const claim of parsed) {
          const existing = await repositories.connectors.findProvenance(claim.entityType, claim.fieldPath);
          classified.push(classifyClaim(claim, existing.ok ? (existing.value ?? undefined) : undefined));
        }
        const batch: ImportBatch = { id: batchId, engagementId, connectorKind: kind, sourceName: connector.descriptor.label, receivedAt, claimCount: classified.length, status: "staged" };
        await repositories.connectors.stageImport(batch, classified);
        await repositories.audit.append(audit(engagementId, batchId, "data-gap-created", `Staged ${classified.length} proposed claims from ${connector.descriptor.label}`));
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [repositories, engagementId, busy, reload],
  );

  const reconcile = useCallback(
    async (claimId: string, action: ReconciliationAction) => {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;
      const outcome = reconcileClaim(claim, action, "user-consultant-1", new Date().toISOString());
      await repositories.connectors.updateClaim(outcome.claim);
      if (outcome.provenance) await repositories.connectors.saveProvenance(outcome.provenance);
      await repositories.audit.append(audit(engagementId, claimId, "registry-state-changed", `Claim ${action} → ${outcome.claim.reconciliationStatus}`));
      await reload();
    },
    [repositories, engagementId, claims, reload],
  );

  return {
    connectors: CONNECTORS.map((c) => c.descriptor),
    batches,
    claims,
    busy,
    runImport,
    reconcile,
  };
}
