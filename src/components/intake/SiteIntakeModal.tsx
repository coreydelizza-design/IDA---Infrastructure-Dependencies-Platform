import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRegistry } from "../../application/registryContext";
import {
  ARCHETYPES,
  COMPONENT_LAYERS,
  COMPONENT_TYPES,
  CIRCUIT_ROLES,
  DEPENDENCY_TYPES,
  OCCUPANCY_MODELS,
  OWNERSHIP_MODELS,
  PHYSICAL_MEDIA,
  SERVICE_TYPES,
  SLIDER_SCALES,
  buildIntakeRecords,
  emptyIntakeForm,
  formFromSite,
  newCircuitDraft,
  newComponentDraft,
  newDependencyDraft,
  newEvidenceDraft,
  type GapDisposition,
  type IntakeForm,
} from "../../application/intake";
import type { AuditEvent, Scale5, SiteRecord } from "../../domain";
import { WORKLOADS, WORKLOAD_CATEGORIES, defaultWorkloadsForArchetype } from "../../domain";
import { Field, LabeledSlider, ProviderSelect, RepeatableSection, type ProviderOption } from "./controls";

/** Set/replace a value on a set of ids, treating the arrays as sets. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

interface SiteIntakeModalProps {
  open: boolean;
  mode: "create" | "edit";
  editingSite?: SiteRecord | null;
  onClose: () => void;
  onComplete: (siteId: string) => void;
}

const STEPS = ["Identity", "Business Context", "Connectivity", "Components & Cloud", "Dependencies", "Evidence & Data Gaps", "Review"];

function audit(engagementId: string, entityId: string, action: AuditEvent["action"], after: string): AuditEvent {
  return { id: `audit-${action}-${entityId}-${Date.now()}`, engagementId, actorUserId: "user-consultant-1", actorRole: "consultant", entityType: "site", entityId, action, timestamp: new Date().toISOString(), beforeSummary: null, afterSummary: after, source: "intake" };
}

export function SiteIntakeModal({ open, mode, editingSite, onClose, onComplete }: SiteIntakeModalProps) {
  const registry = useRegistry();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeForm>(emptyIntakeForm);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setForm(mode === "edit" && editingSite ? formFromSite(editingSite) : emptyIntakeForm());
    void registry.repositories.providers.list().then((res) => {
      if (res.ok) setProviders(res.value.map((p) => ({ id: p.id, name: p.name })));
    });
  }, [open, mode, editingSite, registry.repositories]);

  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Changing the archetype re-seeds the workload presets, but only when the
  // consultant has not customised the selection (empty, or still the previous
  // archetype's preset) — so manual edits are never clobbered.
  const setArchetype = (archetype: string) =>
    setForm((f) => {
      const untouched = f.workloads.length === 0 || sameSet(f.workloads, defaultWorkloadsForArchetype(f.archetype));
      return { ...f, archetype, workloads: untouched ? defaultWorkloadsForArchetype(archetype) : f.workloads };
    });

  const preview = useMemo(() => {
    if (!open) return null;
    const siteId = mode === "edit" && editingSite ? editingSite.id : `site-${(form.code || "new").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-new`;
    return buildIntakeRecords(form, {
      siteId,
      tenantId: registry.organization?.id ?? "",
      enterpriseClientId: registry.currentEnterprise?.id ?? "",
      engagementId: registry.currentEngagement?.id ?? "",
      createdAt: "Just now",
      existing: mode === "edit" && editingSite ? editingSite : undefined,
    });
  }, [open, form, mode, editingSite, registry]);

  if (!open || !preview) return null;

  async function persist() {
    if (saving || !preview) return;
    setSaving(true);
    const { site, circuits, components, dependencies, evidence, dataGaps } = preview;
    const repos = registry.repositories;
    try {
      if (mode === "edit") {
        await repos.sites.update(site);
        await repos.audit.append(audit(site.engagementId, site.id, "site-updated", `${site.code} – ${site.name}`));
      } else {
        const created = await repos.sites.create(site);
        if (!created.ok) { setSaving(false); return; }
        await repos.audit.append(audit(site.engagementId, site.id, "site-created", `${site.code} – ${site.name}`));
      }
      if (circuits.length) await repos.circuits.batchCreate(circuits);
      if (components.length) await repos.components.batchCreate(components);
      if (dependencies.length) await repos.dependencies.batchCreate(dependencies);
      if (evidence.length) await repos.evidence.batchCreate(evidence);
      if (dataGaps.length) {
        await repos.dataGaps.batchCreate(dataGaps);
        await repos.audit.append(audit(site.engagementId, site.id, "data-gap-created", `${dataGaps.length} data gaps recorded`));
      }
      registry.refresh();
      onComplete(site.id);
    } finally {
      setSaving(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="add-site-modal intake-modal" role="dialog" aria-modal="true" aria-labelledby="intake-title">
        <div className="modal-heading">
          <div><div><h2 id="intake-title">{mode === "edit" ? "Edit Site" : "Register New Site"}</h2><p>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <ol className="intake-steps" aria-label="Intake steps">
          {STEPS.map((label, index) => (
            <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
              <button type="button" onClick={() => setStep(index)}>{index + 1}</button>
              <span>{label}</span>
            </li>
          ))}
        </ol>

        <div className="intake-body">
          {step === 0 ? <IdentityStep form={form} set={set} onArchetype={setArchetype} /> : null}
          {step === 1 ? <BusinessStep form={form} set={set} /> : null}
          {step === 2 ? <ConnectivityStep form={form} set={set} providers={providers} /> : null}
          {step === 3 ? <ComponentsStep form={form} set={set} /> : null}
          {step === 4 ? <DependenciesStep form={form} set={set} /> : null}
          {step === 5 ? <EvidenceStep form={form} set={set} gaps={preview.dataGaps} /> : null}
          {step === 6 ? <ReviewStep preview={preview} /> : null}
        </div>

        <div className="intake-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <div className="intake-actions-right">
            <button type="button" className="ghost-button" onClick={() => void persist()} disabled={saving}>Save Draft</button>
            {step > 0 ? <button type="button" className="secondary-button" onClick={() => setStep((s) => s - 1)}>Back</button> : null}
            {!isLast ? (
              <button type="button" className="primary-button" onClick={() => setStep((s) => s + 1)}>Next</button>
            ) : (
              <button type="button" className="primary-button" onClick={() => void persist()} disabled={saving}>{mode === "edit" ? "Save Changes" : "Create Site"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SetFn = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => void;

function IdentityStep({ form, set, onArchetype }: { form: IntakeForm; set: SetFn; onArchetype: (a: string) => void }) {
  return (
    <div className="form-grid">
      <Field label="Site code"><input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="BR-1002" /></Field>
      <Field label="Site name"><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Berlin" /></Field>
      <Field label="Archetype" wide><select value={form.archetype} onChange={(e) => onArchetype(e.target.value)}>{ARCHETYPES.map((a) => <option key={a}>{a}</option>)}</select></Field>
      <Field label="Primary location type"><input value={form.primaryLocationType} onChange={(e) => set("primaryLocationType", e.target.value)} /></Field>
      <Field label="Timezone (Unknown if blank)"><input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="CET (UTC+1)" /></Field>
      <Field label="Address (Unknown if blank)" wide><input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      <Field label="City"><input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
      <Field label="State / Province"><input value={form.stateProvince} onChange={(e) => set("stateProvince", e.target.value)} /></Field>
      <Field label="Country code"><input maxLength={2} value={form.countryCode} onChange={(e) => set("countryCode", e.target.value)} /></Field>
      <Field label="Country name"><input value={form.countryName} onChange={(e) => set("countryName", e.target.value)} /></Field>
      <Field label="Postal code"><input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} /></Field>
      <Field label="Ownership model"><select value={form.ownershipModel} onChange={(e) => set("ownershipModel", e.target.value)}>{OWNERSHIP_MODELS.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Occupancy model"><select value={form.occupancyModel} onChange={(e) => set("occupancyModel", e.target.value)}>{OCCUPANCY_MODELS.map((o) => <option key={o}>{o}</option>)}</select></Field>
      <Field label="Operating hours"><input value={form.operatingHours} onChange={(e) => set("operatingHours", e.target.value)} placeholder="24x7" /></Field>
      <Field label="User count"><input type="number" min={0} value={form.userCount} onChange={(e) => set("userCount", e.target.value)} /></Field>
      <Field label="Endpoint count"><input type="number" min={0} value={form.endpointCount} onChange={(e) => set("endpointCount", e.target.value)} /></Field>
    </div>
  );
}

function WorkloadPicker({ form, set }: { form: IntakeForm; set: SetFn }) {
  const selected = new Set(form.workloads);
  const toggle = (id: string) =>
    set("workloads", selected.has(id) ? form.workloads.filter((w) => w !== id) : [...form.workloads, id]);
  const preset = defaultWorkloadsForArchetype(form.archetype);
  return (
    <div className="workload-picker">
      <div className="workload-picker-head">
        <div>
          <span className="workload-picker-title">Workloads at this site</span>
          <small>{form.workloads.length} selected · the network traffic this location carries</small>
        </div>
        {preset.length > 0 ? (
          <button type="button" className="ghost-button" onClick={() => set("workloads", preset)}>Apply {form.archetype} preset</button>
        ) : null}
      </div>
      <div className="workload-groups">
        {WORKLOAD_CATEGORIES.map((cat) => (
          <div key={cat.id} className="workload-group">
            <span className="workload-group-label">{cat.label}</span>
            <div className="workload-chips">
              {WORKLOADS.filter((w) => w.category === cat.id).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected.has(w.id)}
                  className={`workload-chip${selected.has(w.id) ? " on" : ""}`}
                  onClick={() => toggle(w.id)}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessStep({ form, set }: { form: IntakeForm; set: SetFn }) {
  return (
    <>
    <WorkloadPicker form={form} set={set} />
    <div className="intake-two-col">
      <div className="form-grid">
        <Field label="Business roles (comma-separated)" wide><input value={form.businessRoles} onChange={(e) => set("businessRoles", e.target.value)} placeholder="branch operations, sales" /></Field>
        <Field label="Network roles (comma-separated)" wide><input value={form.networkRoles} onChange={(e) => set("networkRoles", e.target.value)} placeholder="access, edge" /></Field>
        <Field label="Regulatory scope (comma-separated)" wide><input value={form.regulatoryScope} onChange={(e) => set("regulatoryScope", e.target.value)} placeholder="DORA, NIS2" /></Field>
        <Field label="Review cadence"><select value={form.reviewCadence} onChange={(e) => set("reviewCadence", e.target.value)}>{["monthly", "quarterly", "semi-annual", "annual"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="RTO (minutes)"><input type="number" min={0} value={form.rtoMinutes} onChange={(e) => set("rtoMinutes", e.target.value)} /></Field>
        <Field label="RPO (minutes)"><input type="number" min={0} value={form.rpoMinutes} onChange={(e) => set("rpoMinutes", e.target.value)} /></Field>
        <Field label="Max tolerable outage (minutes)"><input type="number" min={0} value={form.mtoMinutes} onChange={(e) => set("mtoMinutes", e.target.value)} /></Field>
        <label className="checkbox-field"><input type="checkbox" checked={form.singleSiteApproved} onChange={(e) => set("singleSiteApproved", e.target.checked)} /><span>Approved single-site design</span></label>
      </div>
      <div className="intake-sliders">
        <LabeledSlider label="Business criticality" value={form.businessCriticality} labels={SLIDER_SCALES.businessCriticality} onChange={(v) => set("businessCriticality", v)} />
        <LabeledSlider label="Operational dependency" value={form.operationalDependency} labels={SLIDER_SCALES.operationalDependency} onChange={(v) => set("operationalDependency", v)} />
        <LabeledSlider label="Safety impact" value={form.safetyImpact} labels={SLIDER_SCALES.safetyImpact} onChange={(v) => set("safetyImpact", v)} />
      </div>
    </div>
    </>
  );
}

function ConnectivityStep({ form, set, providers }: { form: IntakeForm; set: SetFn; providers: ProviderOption[] }) {
  const update = (key: string, patch: Partial<IntakeForm["circuits"][number]>) =>
    set("circuits", form.circuits.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  return (
    <RepeatableSection
      title="Circuits"
      addLabel="Add circuit"
      emptyLabel="No circuits recorded. Add known circuits; unknown carriers become data gaps."
      items={form.circuits}
      onAdd={() => set("circuits", [...form.circuits, newCircuitDraft(`c${form.circuits.length + 1}-${Date.now()}`)])}
      onRemove={(key) => set("circuits", form.circuits.filter((c) => c.key !== key))}
      renderItem={(c) => (
        <div className="form-grid">
          <Field label="State"><select value={c.knownState} onChange={(e) => update(c.key, { knownState: e.target.value as typeof c.knownState })}><option value="known">Known</option><option value="unknown">Unknown</option><option value="not-applicable">Not applicable</option></select></Field>
          <Field label="Role"><select value={c.role} onChange={(e) => update(c.key, { role: e.target.value as typeof c.role })}>{CIRCUIT_ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Service type"><select value={c.serviceType} onChange={(e) => update(c.key, { serviceType: e.target.value as typeof c.serviceType })}>{SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Service identifier"><input value={c.serviceIdentifier} onChange={(e) => update(c.key, { serviceIdentifier: e.target.value })} disabled={c.knownState !== "known"} /></Field>
          <ProviderSelect label="Contracted provider" value={c.contractedProviderId} providers={providers} onChange={(v) => update(c.key, { contractedProviderId: v })} />
          <ProviderSelect label="Underlying provider" value={c.underlyingProviderId} providers={providers} onChange={(v) => update(c.key, { underlyingProviderId: v })} />
          <ProviderSelect label="Access provider" value={c.accessProviderId} providers={providers} onChange={(v) => update(c.key, { accessProviderId: v })} />
          <Field label="Physical medium"><select value={c.physicalMedium} onChange={(e) => update(c.key, { physicalMedium: e.target.value as typeof c.physicalMedium })}>{PHYSICAL_MEDIA.map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Bandwidth"><input type="number" min={0} value={c.bandwidthValue} onChange={(e) => update(c.key, { bandwidthValue: e.target.value })} /></Field>
          <Field label="Unit"><select value={c.bandwidthUnit} onChange={(e) => update(c.key, { bandwidthUnit: e.target.value as typeof c.bandwidthUnit })}><option>Gbps</option><option>Mbps</option></select></Field>
          <Field label="Building entrance" wide><input value={c.buildingEntrance} onChange={(e) => update(c.key, { buildingEntrance: e.target.value })} /></Field>
        </div>
      )}
    />
  );
}

function ComponentsStep({ form, set }: { form: IntakeForm; set: SetFn }) {
  const update = (key: string, patch: Partial<IntakeForm["components"][number]>) =>
    set("components", form.components.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  return (
    <RepeatableSection
      title="Components & cloud resources"
      addLabel="Add component"
      emptyLabel="No components recorded."
      items={form.components}
      onAdd={() => set("components", [...form.components, newComponentDraft(`cm${form.components.length + 1}-${Date.now()}`)])}
      onRemove={(key) => set("components", form.components.filter((c) => c.key !== key))}
      renderItem={(c) => (
        <div className="form-grid">
          <Field label="Component type"><select value={c.componentType} onChange={(e) => update(c.key, { componentType: e.target.value as typeof c.componentType })}>{COMPONENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="OSI layer"><select value={c.layer} onChange={(e) => update(c.key, { layer: e.target.value as typeof c.layer })}>{COMPONENT_LAYERS.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="Manufacturer"><input value={c.manufacturer} onChange={(e) => update(c.key, { manufacturer: e.target.value })} /></Field>
          <Field label="Model"><input value={c.model} onChange={(e) => update(c.key, { model: e.target.value })} /></Field>
          <Field label="Redundancy role"><select value={c.redundancyRole} onChange={(e) => update(c.key, { redundancyRole: e.target.value })}>{["standalone", "primary", "secondary", "active-active", "active-passive", "spare", "unknown"].map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Lifecycle state"><select value={c.lifecycleState} onChange={(e) => update(c.key, { lifecycleState: e.target.value })}>{["planned", "active", "maintenance", "end-of-life", "retired", "unknown"].map((l) => <option key={l}>{l}</option>)}</select></Field>
        </div>
      )}
    />
  );
}

function DependenciesStep({ form, set }: { form: IntakeForm; set: SetFn }) {
  const update = (key: string, patch: Partial<IntakeForm["dependencies"][number]>) =>
    set("dependencies", form.dependencies.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  return (
    <RepeatableSection
      title="Dependencies"
      addLabel="Add dependency"
      emptyLabel="No dependencies recorded."
      items={form.dependencies}
      onAdd={() => set("dependencies", [...form.dependencies, newDependencyDraft(`d${form.dependencies.length + 1}-${Date.now()}`)])}
      onRemove={(key) => set("dependencies", form.dependencies.filter((d) => d.key !== key))}
      renderItem={(d) => (
        <>
          <div className="form-grid">
            <Field label="Dependency type"><select value={d.dependencyType} onChange={(e) => update(d.key, { dependencyType: e.target.value as typeof d.dependencyType })}>{DEPENDENCY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Target (Unknown if blank)"><input value={d.targetLabel} onChange={(e) => update(d.key, { targetLabel: e.target.value })} /></Field>
          </div>
          <div className="intake-sliders">
            <LabeledSlider label="Dependency criticality" value={d.criticality} labels={SLIDER_SCALES.dependencyCriticality} onChange={(v: Scale5) => update(d.key, { criticality: v })} />
            <LabeledSlider label="Substitutability" value={d.substitutability} labels={SLIDER_SCALES.substitutability} onChange={(v: Scale5) => update(d.key, { substitutability: v })} />
            <LabeledSlider label="Failure impact" value={d.failureImpact} labels={SLIDER_SCALES.failureImpact} onChange={(v: Scale5) => update(d.key, { failureImpact: v })} />
          </div>
        </>
      )}
    />
  );
}

function EvidenceStep({ form, set, gaps }: { form: IntakeForm; set: SetFn; gaps: ReturnType<typeof buildIntakeRecords>["dataGaps"] }) {
  const update = (key: string, patch: Partial<IntakeForm["evidence"][number]>) =>
    set("evidence", form.evidence.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const setDisposition = (fieldPath: string, disposition: GapDisposition) =>
    set("gapDispositions", { ...form.gapDispositions, [fieldPath]: disposition });
  return (
    <div className="intake-two-col">
      <RepeatableSection
        title="Evidence"
        addLabel="Add evidence"
        emptyLabel="No evidence recorded. Attachment storage is deferred; metadata is captured now."
        items={form.evidence}
        onAdd={() => set("evidence", [...form.evidence, newEvidenceDraft(`e${form.evidence.length + 1}-${Date.now()}`)])}
        onRemove={(key) => set("evidence", form.evidence.filter((e) => e.key !== key))}
        renderItem={(e) => (
          <div className="form-grid">
            <Field label="Type"><select value={e.evidenceType} onChange={(ev) => update(e.key, { evidenceType: ev.target.value as typeof e.evidenceType })}>{["contract", "loa", "cfa", "carrier-letter", "circuit-record", "network-diagram", "cmdb-export", "cloud-inventory", "invoice", "email-confirmation", "photo", "other"].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Title"><input value={e.title} onChange={(ev) => update(e.key, { title: ev.target.value })} /></Field>
            <Field label="Source"><input value={e.source} onChange={(ev) => update(e.key, { source: ev.target.value })} /></Field>
            <Field label="Document date"><input type="date" value={e.documentDate} onChange={(ev) => update(e.key, { documentDate: ev.target.value })} /></Field>
            <Field label="Effective date"><input type="date" value={e.effectiveDate} onChange={(ev) => update(e.key, { effectiveDate: ev.target.value })} /></Field>
            <Field label="Expiration date"><input type="date" value={e.expirationDate} onChange={(ev) => update(e.key, { expirationDate: ev.target.value })} /></Field>
          </div>
        )}
      />
      <div className="intake-gaps">
        <h4>Auto-generated data gaps ({gaps.length})</h4>
        {gaps.length === 0 ? <p className="intake-empty">No data gaps for the facts provided.</p> : (
          <ul className="intake-gap-list">
            {gaps.map((gap) => (
              <li key={gap.id}>
                <div><strong>{gap.title}</strong><small>{gap.gapType}</small></div>
                <select value={form.gapDispositions[gap.fieldPath] ?? gap.requestedFrom} onChange={(e) => setDisposition(gap.fieldPath, e.target.value as GapDisposition)} aria-label={`Classify ${gap.title}`}>
                  <option value="enterprise">Enterprise follow-up</option>
                  <option value="carrier">Carrier confirmation</option>
                  <option value="consultant-research">Consultant research</option>
                  <option value="accepted-unknown">Accepted unknown</option>
                  <option value="not-required">Not required</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReviewStep({ preview }: { preview: ReturnType<typeof buildIntakeRecords> }) {
  const { site, circuits, components, dependencies, evidence, dataGaps } = preview;
  const openGaps = dataGaps.filter((g) => g.status === "open");
  return (
    <div className="intake-review">
      <div className="intake-review-grid">
        <div><span>Data completeness</span><strong>{site.completenessPercent}%</strong></div>
        <div><span>Provisional assurance</span><strong className={`health-${site.score.band}`}>{site.score.score}</strong></div>
        <div><span>Evidence confidence</span><strong>{site.evidenceConfidencePercent}%</strong></div>
        <div><span>Open data gaps</span><strong>{openGaps.length}</strong></div>
        <div><span>Enterprise confirmations</span><strong>{site.pendingEnterpriseRequestCount}</strong></div>
        <div><span>Carrier confirmations</span><strong>{site.pendingCarrierRequestCount}</strong></div>
        <div><span>Unresolved dependencies</span><strong>{site.unresolvedDependencyCount}</strong></div>
      </div>
      <div className="intake-review-records">
        <h4>Records to be created</h4>
        <ul>
          <li>1 site ({site.code} – {site.name}), registry state <em>{site.registryState}</em></li>
          <li>{circuits.length} circuit{circuits.length === 1 ? "" : "s"} · {components.length} component{components.length === 1 ? "" : "s"} · {dependencies.length} dependenc{dependencies.length === 1 ? "y" : "ies"}</li>
          <li>{evidence.length} evidence record{evidence.length === 1 ? "" : "s"} · {dataGaps.length} data gap{dataGaps.length === 1 ? "" : "s"}</li>
        </ul>
        <p className="intake-note">Assurance is provisional — formal control assessment is a later phase. Unknown facts are recorded as data gaps, not fabricated records.</p>
      </div>
    </div>
  );
}
