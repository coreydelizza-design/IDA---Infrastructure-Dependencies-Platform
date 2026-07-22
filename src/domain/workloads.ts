// Site workloads — the categories of business / network traffic a location
// carries. A dependency fact (what would be impacted if the site degraded), so
// it complements criticalServices and feeds criticality/impact. Captured as a
// grouped multi-select in the intake wizard; archetype presets pre-tick the
// typical set so capture is fast at scale.

export interface WorkloadCategory {
  id: string;
  label: string;
}

/** Ordered categories — the grouping the capture checklist and displays use. */
export const WORKLOAD_CATEGORIES: WorkloadCategory[] = [
  { id: "business", label: "Business apps" },
  { id: "transactional", label: "Transactional" },
  { id: "comms", label: "Real-time comms" },
  { id: "ot", label: "OT / industrial" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "access", label: "User & access" },
  { id: "management", label: "Management" },
];

interface WorkloadDef {
  id: string;
  label: string;
  category: WorkloadCategory["id"];
}

/** The workload catalog. Ids are stable; labels/grouping are presentation. */
export const WORKLOADS = [
  { id: "core-business-app", label: "Core business app (ERP/LOB)", category: "business" },
  { id: "critical-saas", label: "Critical SaaS", category: "business" },
  { id: "ai-ml", label: "AI / ML", category: "business" },
  { id: "data-analytics", label: "Data analytics / warehouse", category: "business" },
  { id: "web-ecommerce", label: "Web / e-commerce", category: "business" },

  { id: "payment", label: "Payment processing", category: "transactional" },
  { id: "pos-store", label: "Store / POS traffic", category: "transactional" },
  { id: "trading", label: "Trading & market data", category: "transactional" },
  { id: "core-banking", label: "Core banking / transactions", category: "transactional" },

  { id: "voice", label: "Voice / VoIP", category: "comms" },
  { id: "video-uc", label: "Video / UC", category: "comms" },
  { id: "contact-center", label: "Contact-center / IVR", category: "comms" },

  { id: "scada-ot", label: "Industrial control / SCADA", category: "ot" },
  { id: "iot-telemetry", label: "IoT & sensor telemetry", category: "ot" },
  { id: "bms", label: "Building management (BMS)", category: "ot" },
  { id: "physical-security", label: "Physical security / CCTV", category: "ot" },

  { id: "dc-compute", label: "Data-center / server compute", category: "infrastructure" },
  { id: "cloud-connectivity", label: "Cloud connectivity", category: "infrastructure" },
  { id: "backup-dr", label: "Backup / replication / DR", category: "infrastructure" },
  { id: "storage-replication", label: "Storage / SAN replication", category: "infrastructure" },

  { id: "user-internet", label: "General office / user internet", category: "access" },
  { id: "guest-wifi", label: "Guest / retail Wi-Fi", category: "access" },
  { id: "remote-access", label: "Remote access / VPN", category: "access" },
  { id: "wireless-failover", label: "Wireless / mobile failover", category: "access" },

  { id: "network-management", label: "Network management / monitoring", category: "management" },
  { id: "software-distribution", label: "Software distribution / patching", category: "management" },
] as const satisfies readonly WorkloadDef[];

export type WorkloadId = (typeof WORKLOADS)[number]["id"];

const WORKLOAD_BY_ID = new Map<string, WorkloadDef>(WORKLOADS.map((w) => [w.id, w]));

export function isWorkloadId(value: string): value is WorkloadId {
  return WORKLOAD_BY_ID.has(value);
}

export function workloadLabel(id: string): string {
  return WORKLOAD_BY_ID.get(id)?.label ?? id;
}

/** Group a site's workload ids by category, in category order, keeping only
 *  categories that have at least one workload. Unknown ids are dropped. */
export function groupWorkloadsByCategory(ids: readonly string[]): Array<{ category: WorkloadCategory; items: WorkloadDef[] }> {
  const set = new Set(ids);
  return WORKLOAD_CATEGORIES.map((category) => ({
    category,
    items: WORKLOADS.filter((w) => w.category === category.id && set.has(w.id)),
  })).filter((group) => group.items.length > 0);
}

/** Archetype → typical workloads. Pre-ticked in the wizard so the consultant
 *  confirms and adjusts rather than starting from a blank slate. */
export const ARCHETYPE_WORKLOAD_PRESETS: Record<string, WorkloadId[]> = {
  "Branch Office": ["pos-store", "payment", "voice", "user-internet", "guest-wifi"],
  "Regional Office": ["core-business-app", "voice", "video-uc", "user-internet"],
  "Primary Data Center": ["dc-compute", "backup-dr", "cloud-connectivity", "core-business-app", "ai-ml"],
  "Secondary Data Center": ["dc-compute", "backup-dr", "storage-replication", "cloud-connectivity"],
  "Cloud Region": ["cloud-connectivity", "ai-ml", "dc-compute", "backup-dr"],
  "Network Hub": ["cloud-connectivity", "network-management", "dc-compute", "user-internet"],
  "Edge Site": ["wireless-failover", "iot-telemetry", "pos-store", "user-internet"],
  "Manufacturing Site": ["scada-ot", "iot-telemetry", "bms", "physical-security", "user-internet"],
  "Warehouse": ["pos-store", "iot-telemetry", "physical-security", "wireless-failover", "user-internet"],
  "Contact Center": ["contact-center", "voice", "core-business-app", "user-internet"],
  "Financial Trading Floor": ["trading", "voice", "core-banking", "user-internet"],
};

export function defaultWorkloadsForArchetype(archetype: string): WorkloadId[] {
  return [...(ARCHETYPE_WORKLOAD_PRESETS[archetype] ?? [])];
}
