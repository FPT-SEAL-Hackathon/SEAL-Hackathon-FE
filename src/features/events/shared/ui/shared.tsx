import { useState } from "react";
import { Upload, X, Search } from "lucide-react";
//import { Card, Button, COLORS } from "/../../shared/UIComponents";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents"
import type { EventCriteria } from "../../types/eventCriteria";
import { ImportEventCriteriaRequest, RoundCriteria, UpdateRoundCriterionRequest } from "../../types/round";

// ── Form primitives ────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          fontSize: 11, fontWeight: 600, color: COLORS.textSecondary,
          display: "block", marginBottom: 4,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input({
  value, onChange, placeholder, type = "text", disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-xl outline-none"
      style={{
        fontSize: 13,
        border: `1px solid ${COLORS.border}`,
        background: disabled ? "var(--surface-bg)" : COLORS.bg,
        color: COLORS.textPrimary,
      }}
    />
  );
}

export function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-xl outline-none resize-none"
      style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
    />
  );
}

export function Select({
  value, onChange, children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl outline-none"
      style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
    >
      {children}
    </select>
  );
}

// ── Assign People Modal ────────────────────────────────────────────────────

export function AssignModal<T extends { id: string; fullName: string; email: string; phone: string; role?: string; roleName?: string }>({
  title, allPeople, assignedIds, onAssign, onRemove, onClose,
}: {
  title: string;
  allPeople: T[];
  assignedIds: string[];
  onAssign: (p: T) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const assignedIdsSet = new Set(assignedIds);

  const filtered = allPeople
    .filter(p => {
      const q = search.toLowerCase();
      return (
        (p.fullName ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aAssigned = assignedIdsSet.has(a.id);
      const bAssigned = assignedIdsSet.has(b.id);
      if (aAssigned === bAssigned) return 0;
      return aAssigned ? 1 : -1;
    });

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", zIndex: 100 }}>
      <Card className="p-6 w-full max-w-md" style={{ maxHeight: "82vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{title}</span>
          <button onClick={onClose}><X size={16} style={{ color: COLORS.textSecondary }} /></button>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl outline-none"
            style={{
              fontSize: 13,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              color: COLORS.textPrimary,
            }}
          />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-6 text-center" style={{ fontSize: 13, color: COLORS.textSecondary }}>
              No experts found
            </div>
          ) : (
            filtered.map(p => {
              const isAssigned = assignedIdsSet.has(p.id);
              const roleLabel = p.roleName ?? p.role?.replace(/^ROLE_/, "").replace(/_/g, " ");
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: isAssigned ? `${COLORS.success}08` : "var(--surface-bg)",
                    border: isAssigned ? `1px solid ${COLORS.success}30` : "1px solid transparent",
                    opacity: isAssigned ? 0.75 : 1,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.fullName}</span>
                      {roleLabel && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider"
                          style={{ background: `${COLORS.success}20`, color: COLORS.success }}
                        >
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{p.email}</div>
                  </div>
                  {isAssigned
                    ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: COLORS.success,
                        padding: "3px 10px", borderRadius: 999,
                        background: `${COLORS.success}15`, border: `1px solid ${COLORS.success}30`,
                      }}>
                        Assigned
                      </span>
                    )
                    : <Button variant="primary" size="sm" onClick={() => onAssign(p)}>Assign</Button>
                  }
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
}

// ── Criteria import panel (used inside RoundsTab for per-round criteria) ───

export function CriteriaImportPanel({
  title,
  sourceLabel,
  availableCriteria,
  roundCriteria,
  onImport,
  onUpdateRoundCriteria,
  onRemoveRoundCriteria,
}: {
  title: string;
  sourceLabel: string;
  availableCriteria: EventCriteria[];
  roundCriteria: RoundCriteria[];
  onImport: (body: ImportEventCriteriaRequest) => void;
  onUpdateRoundCriteria: (
    roundCriterionId: string,
    body: UpdateRoundCriterionRequest
  ) => void;
  onRemoveRoundCriteria: (roundCriterionId: string) => void;
}) {
  const [showImport, setShowImport] = useState(false);
  const importedIds = new Set(roundCriteria.map(rc => rc.eventCriterionId));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{title}</span>
        <Button variant="outline" size="sm" icon={<Upload size={12} />} onClick={() => setShowImport(v => !v)}>
          Import from {sourceLabel}
        </Button>
      </div>

      {showImport && (
        <Card className="p-4 mb-3" style={{ border: `1px solid ${COLORS.primary}30` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>SELECT CRITERIA TO IMPORT</div>
          <div className="space-y-2">
            {availableCriteria.map(field => (
              <div key={field.eventCriterionId} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--surface-bg)" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>{field.criterionName}</span>
                  <span style={{ fontSize: 11, color: COLORS.textSecondary, marginLeft: 8 }}>
                    Weight: {field.weight} | Max: {field.maxScore}
                  </span>
                </div>
                {importedIds.has(field.eventCriterionId)
                  ? <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>Imported</span>
                  : <Button variant="primary" size="sm" onClick={() => { onImport({ eventCriterionIds: [field.eventCriterionId] }); setShowImport(false); }}>Import</Button>}
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowImport(false)}>Close</Button>
        </Card>
      )}

      {roundCriteria.length === 0 ? (
        <div className="py-6 text-center rounded-xl" style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}>
          No criteria imported yet
        </div>
      ) : (
        <div className="space-y-2">
          {roundCriteria.map(c => (
            <div key={c.eventCriterionId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}` }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>{c.criterionName}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Weight</span>
                  <input
                    type="number"
                    value={c.weight}
                    onChange={e =>
                      onUpdateRoundCriteria(
                        c.eventCriterionId,
                        {
                          weight: Number(e),
                          maxScore: c.maxScore
                        }
                      )}
                    className="rounded-lg px-2 py-1 outline-none"
                    style={{ width: 60, fontSize: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, textAlign: "center" }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Max</span>
                  <input
                    type="number"
                    value={c.maxScore}
                    onChange={e =>
                      onUpdateRoundCriteria(
                        c.roundCriterionId,
                        {
                          weight: c.weight,
                          maxScore: Number(e)
                        }
                      )}
                    className="rounded-lg px-2 py-1 outline-none"
                    style={{ width: 60, fontSize: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, textAlign: "center" }}
                  />
                </div>
                <button onClick={() => onRemoveRoundCriteria(c.roundCriterionId)} className="p-1 rounded-lg transition-colors hover:bg-red-50" style={{ color: COLORS.error }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
