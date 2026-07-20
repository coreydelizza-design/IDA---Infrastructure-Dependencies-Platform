import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Scale5 } from "../../domain";

export function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? "form-wide" : undefined}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function LabeledSlider({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: Scale5;
  labels: readonly string[];
  onChange: (value: Scale5) => void;
}) {
  return (
    <div className="intake-slider">
      <div className="intake-slider-head">
        <span>{label}</span>
        <strong>{value} · {labels[value - 1]}</strong>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as Scale5)}
        aria-label={`${label}: ${labels[value - 1]}`}
      />
      <div className="intake-slider-scale">
        {labels.map((l, index) => (
          <em key={l} className={index + 1 === value ? "active" : ""}>{index + 1}</em>
        ))}
      </div>
      <p className="intake-slider-def">{labels[value - 1]}</p>
    </div>
  );
}

export function RepeatableSection<T extends { key: string }>({
  title,
  items,
  addLabel,
  emptyLabel,
  onAdd,
  onRemove,
  renderItem,
}: {
  title: string;
  items: T[];
  addLabel: string;
  emptyLabel: string;
  onAdd: () => void;
  onRemove: (key: string) => void;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="intake-repeatable">
      <div className="intake-repeatable-head">
        <h4>{title}</h4>
        <button type="button" className="intake-add-btn" onClick={onAdd}><Plus size={13} /> {addLabel}</button>
      </div>
      {items.length === 0 ? (
        <p className="intake-empty">{emptyLabel}</p>
      ) : (
        <div className="intake-card-list">
          {items.map((item, index) => (
            <div className="intake-card" key={item.key}>
              <div className="intake-card-head">
                <span>#{index + 1}</span>
                <button type="button" className="intake-remove-btn" aria-label="Remove" onClick={() => onRemove(item.key)}><Trash2 size={13} /></button>
              </div>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ProviderOption {
  id: string;
  name: string;
}

export function ProviderSelect({
  label,
  value,
  providers,
  onChange,
}: {
  label: string;
  value: string;
  providers: ProviderOption[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Unknown</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>{provider.name}</option>
        ))}
      </select>
    </Field>
  );
}
