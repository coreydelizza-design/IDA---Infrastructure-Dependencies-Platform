import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SiteRisk } from "../domain/models";

interface RiskPeekProps {
  /** Risk count the card advertises (source of truth for the label). */
  count: number;
  risks: SiteRisk[];
  siteLabel: string;
}

const severityOrder: Record<SiteRisk["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Hover / focus "risk peek" — projects the site's open risks in a popover so a
 * consultant can triage without opening the full inspector. The popover is
 * rendered in a portal (document.body) and fixed-positioned from the trigger's
 * rect, so it escapes the card's overflow:hidden and CSS context and projects
 * cleanly over the grid. Transient (interaction-only) — the static baseline
 * render is unchanged.
 */
export function RiskPeek({ count, risks, siteLabel }: RiskPeekProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const openRisks = risks
    .filter((r) => r.status !== "closed")
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.right, top: r.top });
  }, []);

  const show = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    place();
    setOpen(true);
  }, [place]);

  const scheduleHide = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const popover = open && pos && typeof document !== "undefined"
    ? createPortal(
        <div
          className="risk-peek-popover"
          role="dialog"
          aria-label={`Open risks at ${siteLabel}`}
          style={{ left: pos.left, top: pos.top }}
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          <div className="risk-peek-head">Open risks · {siteLabel}</div>
          {openRisks.length > 0 ? (
            <div className="risk-peek-list">
              {openRisks.map((r) => (
                <div className="risk-peek-item" key={r.id}>
                  <span className={`risk-peek-sev sev-${r.severity}`} aria-hidden="true" />
                  <span className="risk-peek-title">{r.title}</span>
                  <span className="risk-peek-meta">{r.severity}{r.control ? ` · ${r.control}` : ""}</span>
                </div>
              ))}
              {count > openRisks.length ? <div className="risk-peek-more">+{count - openRisks.length} more</div> : null}
            </div>
          ) : (
            <div className="risk-peek-empty">{count} open risk{count === 1 ? "" : "s"} — open the site for detail.</div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      ref={triggerRef}
      className="risk-peek-trigger risk-text"
      role="button"
      tabIndex={0}
      aria-label={`${count} open risk${count === 1 ? "" : "s"} at ${siteLabel} — preview`}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={scheduleHide}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "Enter" || e.key === " ") e.stopPropagation();
      }}
    >
      {`${count} Open risk${count === 1 ? "" : "s"}`}
      <span aria-hidden="true">›</span>
      {popover}
    </span>
  );
}
