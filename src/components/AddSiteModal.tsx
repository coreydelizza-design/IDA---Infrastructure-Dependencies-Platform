import { Plus, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type { Site } from "../domain/models";
import { computeResilienceScore } from "../domain/scoring";
import { deriveRegistrationDataGaps } from "../domain/assurance";

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (site: Site) => void;
}

const typeOptions = [
  "Branch Office",
  "Regional Office",
  "Primary Data Center",
  "Secondary Data Center",
  "Cloud Region",
  "Network Hub",
  "Edge Site",
  "Manufacturing Site",
  "Warehouse",
  "Contact Center",
];

function assetForType(type: string): string {
  if (type.includes("Cloud")) return "/assets/sites/aws-eu-west-1.webp";
  if (type.includes("Data Center")) return "/assets/sites/dc1-london.webp";
  if (type.includes("Hub")) return "/assets/sites/hub-amsterdam.webp";
  if (type.includes("Edge")) return "/assets/sites/edge-25-madrid.webp";
  return "/assets/sites/br-1001-paris.webp";
}

export function AddSiteModal({ open, onClose, onCreate }: AddSiteModalProps) {
  const [code, setCode] = useState("BR-1002");
  const [name, setName] = useState("Berlin");
  const [city, setCity] = useState("Berlin");
  const [countryCode, setCountryCode] = useState("DE");
  const [countryName, setCountryName] = useState("Germany");
  const [type, setType] = useState("Branch Office");
  const [carrierCount, setCarrierCount] = useState(1);
  const [singleSiteApproved, setSingleSiteApproved] = useState(false);
  const [requireEnterpriseFollowUp, setRequireEnterpriseFollowUp] = useState(true);
  const [requireCarrierConfirmation, setRequireCarrierConfirmation] = useState(true);

  const previewScore = useMemo(() => {
    const profileRequiresDiversity = type.includes("Data Center") || type.includes("Hub") || type.includes("Contact");
    return computeResilienceScore({
      controls: [
        { id: "power", weight: 20, result: "pass" },
        { id: "facility", weight: 15, result: "pass" },
        { id: "connectivity-diversity", weight: 30, result: carrierCount > 1 ? "pass" : "fail", isConnectivityDiversityControl: true },
        { id: "cyber", weight: 20, result: "pass" },
        { id: "recovery", weight: 15, result: "partial" },
      ],
      profile: {
        id: type.toLowerCase().replaceAll(" ", "-"),
        version: "2026.1",
        archetype: type,
        redundancyExpectation: profileRequiresDiversity ? "required" : "acceptable-single",
        criticalCaps: profileRequiresDiversity ? [{ controlId: "connectivity-diversity", maxScore: 69 }] : [],
      },
      singleSiteApproved,
      assessedAt: "Just now",
    });
  }, [carrierCount, singleSiteApproved, type]);

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const createdAt = "Just now";
    const suffix = code.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
    const id = `site-${suffix}-new`;

    // Carrier and circuit facts are unknown at registration. We do NOT fabricate
    // carrier or circuit records — we record data gaps for the missing facts and
    // let the consultant flag enterprise follow-up and/or carrier confirmation.
    const dataGaps = deriveRegistrationDataGaps({
      siteId: id,
      code: code.trim(),
      knownCarrierCount: carrierCount,
      providedFields: {},
      requireEnterpriseFollowUp,
      requireCarrierConfirmation,
      createdAt,
    });

    const enterpriseGaps = dataGaps.filter((gap) => gap.followUp === "enterprise").length;
    const carrierGaps = dataGaps.filter((gap) => gap.followUp === "carrier").length;

    onCreate({
      id,
      code: code.trim(),
      name: name.trim(),
      type,
      locationType: type,
      criticality: type.includes("Data Center") ? "Tier I Mission Critical" : "Tier III Business Critical",
      city: city.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      countryName: countryName.trim(),
      region: "Unassigned",
      address: "Not yet provided",
      timezone: "Not yet provided",
      owner: "Not yet assigned",
      engagementId: "eng-enterprise-co",
      registryState: "collecting",
      assessmentStatus: "in-progress",
      completenessPercent: 10,
      lastVerifiedAt: "Not yet verified",
      nextReviewAt: "in 30 days",
      pendingEnterpriseRequests: requireEnterpriseFollowUp ? enterpriseGaps : 0,
      pendingCarrierRequests: requireCarrierConfirmation ? carrierGaps : 0,
      unresolvedDependencyCount: carrierCount,
      verificationSummary: { verified: 0, providerClaimed: 0, unverified: carrierCount, gaps: carrierCount },
      favorite: false,
      evidenceBadge: singleSiteApproved ? "single-site-acceptable" : null,
      imageAsset: assetForType(type),
      score: previewScore,
      carrierConnections: [],
      dependencyCount: 0,
      cardOpenRiskCount: carrierCount === 1 && !singleSiteApproved ? 1 : 0,
      risks: carrierCount === 1 && !singleSiteApproved
        ? [{ id: `RSK-${suffix.slice(0, 4).toUpperCase()}`, title: "Single carrier dependency", severity: "high", status: "open", control: "NET-DIV-01" }]
        : [],
      criticalServices: [],
      resilienceIndicators: [
        { id: "power", label: "Power Resilience", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "connectivity", label: "Connectivity Resilience", value: singleSiteApproved ? "Approved Single-Site" : carrierCount > 1 ? "Multi-Carrier" : "Single Carrier", state: singleSiteApproved ? "not-applicable" : carrierCount > 1 ? "pass" : "fail", verification: "unknown" },
        { id: "facility", label: "Facility Resilience", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "environment", label: "Environmental Controls", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "physical", label: "Physical Security", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "workforce", label: "Workforce Availability", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "cyber", label: "Cyber Resilience", value: "Assessment pending", state: "warning", verification: "unknown" },
        { id: "recovery", label: "Backup & Recovery", value: "Assessment pending", state: "warning", verification: "unknown" },
      ],
      compliance: [
        { framework: "DORA", state: "mapped", mappedControls: 0, lastAssessed: "Not assessed" },
        { framework: "ICT (EU)", state: "mapped", mappedControls: 0, lastAssessed: "Not assessed" },
      ],
      evidenceConfidence: "low",
      evidenceConfidencePercent: 10,
      activity: [{ id: `${id}-created`, action: "Site registered", actor: "AB", relativeTime: "Just now" }],
      dataGaps,
      tags: [type.toLowerCase().replaceAll(" ", "-"), "new-site", "evidence-pending"],
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="add-site-modal" role="dialog" aria-modal="true" aria-labelledby="add-site-title">
        <div className="modal-heading">
          <div><span className="modal-icon"><Plus size={18} /></span><div><h2 id="add-site-title">Register New Site</h2><p>Create a registry record and baseline scoring profile.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label><span>Site code</span><input required value={code} onChange={(event) => setCode(event.target.value)} /></label>
            <label><span>Site name</span><input required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="form-wide"><span>Archetype</span><select value={type} onChange={(event) => setType(event.target.value)}>{typeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>City</span><input required value={city} onChange={(event) => setCity(event.target.value)} /></label>
            <label><span>Country code</span><input required maxLength={2} value={countryCode} onChange={(event) => setCountryCode(event.target.value)} /></label>
            <label className="form-wide"><span>Country name</span><input required value={countryName} onChange={(event) => setCountryName(event.target.value)} /></label>
            <label><span>Known carrier count</span><input type="number" min={0} max={4} value={carrierCount} onChange={(event) => setCarrierCount(Number(event.target.value))} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={singleSiteApproved} onChange={(event) => setSingleSiteApproved(event.target.checked)} /><span>Approved single-site design</span></label>
            <label className="checkbox-field"><input type="checkbox" checked={requireEnterpriseFollowUp} onChange={(event) => setRequireEnterpriseFollowUp(event.target.checked)} /><span>Enterprise follow-up required</span></label>
            <label className="checkbox-field"><input type="checkbox" checked={requireCarrierConfirmation} onChange={(event) => setRequireCarrierConfirmation(event.target.checked)} /><span>Carrier confirmation required</span></label>
          </div>
          <div className="score-preview">
            <span>Baseline score</span>
            <strong className={`health-${previewScore.band}`}>{previewScore.score}</strong>
            <p>{singleSiteApproved ? "The approved single-site pattern is not penalized." : "Unverified or required diversity gaps affect technical health."}</p>
          </div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Create Site</button></div>
        </form>
      </div>
    </div>
  );
}
