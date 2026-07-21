import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ResilienceIndicator, ServiceAssuranceState, Site } from "../domain";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";

interface FullscreenSiteCardProps {
  site: Site;
  /** The currently filtered inventory, for prev/next navigation. */
  sites: Site[];
  onSelectSite: (siteId: string) => void;
  onClose: () => void;
}

const assuredServiceStates: ServiceAssuranceState[] = ["confirmed", "consultant-verified", "documented"];

function typeClass(type: string): string {
  if (type.includes("Data Center") || type.includes("Trading") || type.includes("Cloud")) return "type-green";
  if (type.includes("Branch") || type.includes("Regional")) return "type-amber";
  if (type.includes("Edge")) return "type-red";
  return "type-slate";
}

const indicatorStateClass: Record<ResilienceIndicator["state"], string> = {
  pass: "ok",
  warning: "warn",
  fail: "bad",
  "not-applicable": "muted",
};

/**
 * Fullscreen readable projection of the selected site card. Rendered via a portal
 * to document.body so it sits OUTSIDE the scaled, clipped `.app-shell` — its text
 * is legible at true pixel size regardless of the device down-scale. Opt-in
 * (Administration → Site inventory layout → Fullscreen); the locked docked
 * default is unchanged.
 */
export function FullscreenSiteCard({ site, sites, onSelectSite, onClose }: FullscreenSiteCardProps) {
  const index = sites.findIndex((s) => s.id === site.id);
  const canPage = sites.length > 1;

  const goPrev = useCallback(() => {
    if (!canPage) return;
    const i = index <= 0 ? sites.length - 1 : index - 1;
    onSelectSite(sites[i].id);
  }, [canPage, index, sites, onSelectSite]);

  const goNext = useCallback(() => {
    if (!canPage) return;
    const i = index >= sites.length - 1 ? 0 : index + 1;
    onSelectSite(sites[i].id);
  }, [canPage, index, sites, onSelectSite]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  const carrierLabel = site.carrierConnections.length === 1 && site.type === "Cloud Region"
    ? "1 Provider"
    : `${site.carrierConnections.length} ${site.carrierConnections.length === 1 ? "Carrier" : "Carriers"}`;
  const openCritical = site.risks.filter((r) => r.severity === "critical" && r.status !== "closed").length;
  const servicesAssured = Math.round(
    (site.criticalServices.filter((s) => assuredServiceStates.includes(s.assuranceState)).length / Math.max(site.criticalServices.length, 1)) * 100,
  );
  const activeRisks = site.risks.filter((r) => r.status !== "closed");

  return createPortal(
    <div className="fs-card-backdrop" role="dialog" aria-modal="true" aria-label={`${site.code} ${site.name} — full screen`} onClick={onClose}>
      <div className="fs-card" onClick={(e) => e.stopPropagation()}>
        <div className="fs-card-banner">
          <img src={site.imageAsset} alt="" className="fs-card-image" draggable={false} />
          <div className="fs-card-banner-scrim" />
          <span className={`fs-type-chip ${typeClass(site.type)}`}>{site.type}</span>
          <button type="button" className="fs-close" aria-label="Close full screen" onClick={onClose}><X size={20} /></button>
          <div className="fs-card-heading">
            <h2>{site.code} – {site.name}</h2>
            <p>{site.city}, {site.countryName}</p>
          </div>
        </div>

        <div className="fs-card-body">
          <div className="fs-score-block">
            <ScoreRing score={site.score.score} band={site.score.band} size="focus" />
            <div className="fs-score-label">
              <span>Architecture Assurance</span>
              <strong className={`health-${site.score.band}`}>{site.score.label}</strong>
              <StatusBadge status={site.evidenceBadge} />
            </div>
          </div>

          <div className="fs-stat-grid">
            <div className="fs-stat"><span>{carrierLabel.replace(/^\d+\s/, "")}</span><strong>{site.carrierConnections.length}</strong></div>
            <div className="fs-stat"><span>Dependencies</span><strong>{site.dependencyCount}</strong></div>
            <div className="fs-stat"><span>Open Critical Risks</span><strong className={openCritical > 0 ? "health-critical" : ""}>{openCritical}</strong></div>
            <div className="fs-stat"><span>Services Assured</span><strong>{servicesAssured}%</strong></div>
          </div>

          <div className="fs-columns">
            <section className="fs-section">
              <h3>Resilience indicators</h3>
              <ul className="fs-indicators">
                {site.resilienceIndicators.map((ind) => (
                  <li key={ind.id}>
                    <span className={`fs-dot ${indicatorStateClass[ind.state]}`} aria-hidden="true" />
                    <span className="fs-ind-label">{ind.label}</span>
                    <strong>{ind.value}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <section className="fs-section">
              <h3>Open risks{activeRisks.length ? ` (${activeRisks.length})` : ""}</h3>
              {activeRisks.length ? (
                <ul className="fs-risks">
                  {activeRisks.map((r) => (
                    <li key={r.id}>
                      <span className={`fs-sev sev-${r.severity}`}>{r.severity}</span>
                      <span className="fs-risk-title">{r.title}</span>
                      {r.control ? <em>{r.control}</em> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="fs-no-risk">No open risks — all identified risks are closed or accepted.</p>
              )}
            </section>
          </div>
        </div>

        {canPage ? (
          <div className="fs-pager">
            <button type="button" onClick={goPrev} aria-label="Previous site"><ChevronLeft size={18} /> Prev</button>
            <span>{index + 1} of {sites.length}</span>
            <button type="button" onClick={goNext} aria-label="Next site">Next <ChevronRight size={18} /></button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
