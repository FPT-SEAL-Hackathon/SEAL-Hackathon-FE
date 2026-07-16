import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button, COLORS } from "@/components/shared/UIComponents";

/**
 * Bộ component "Filter and sort" dùng chung cho các màn quản lý (User Management,
 * Event Participants...): panel trượt từ phải chứa mọi thuộc tính dạng CHỌN
 * (facet/select/date/sort), ngoài trang chỉ giữ ô search text.
 * Mô hình theo bản phân tích facet-filter: OR trong nhóm, AND giữa nhóm,
 * chip cho filter đang chọn, CTA preview số kết quả.
 */

// Chip filter đang chọn — hiển thị trên bảng, gỡ từng cái bằng nút X.
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{ background: `${COLORS.primary}12`, color: COLORS.primary, fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.primary}30` }}
    >
      {label}
      <button type="button" onClick={onRemove} style={{ display: "inline-flex", background: "none", border: "none", cursor: "pointer", color: "inherit" }} aria-label={`Remove ${label}`}>
        <X size={12} />
      </button>
    </span>
  );
}

// Nhóm accordion trong panel; dot cạnh tên khi nhóm có filter active.
export function FacetGroup({ title, open, hasActive, onToggle, children }: {
  title: string;
  open: boolean;
  hasActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
          {title}
          {hasActive && <span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.primary, display: "inline-block" }} />}
        </span>
        {open ? <ChevronUp size={16} style={{ color: COLORS.textSecondary }} /> : <ChevronDown size={16} style={{ color: COLORS.textSecondary }} />}
      </button>
      {open && <div className="px-5 pb-4 space-y-1">{children}</div>}
    </div>
  );
}

// Một option multi-select trong nhóm facet: checkbox + nhãn + count (drill-down).
export function FacetOptionRow({ label, count, checked, onToggle }: {
  label: string;
  count: number | null;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg cursor-pointer"
      style={{ background: checked ? `${COLORS.primary}0A` : "transparent" }}
    >
      <span className="flex items-center gap-2.5">
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: COLORS.primary, width: 15, height: 15, cursor: "pointer" }} />
        <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{label}</span>
      </span>
      <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{count !== null ? `(${count})` : ""}</span>
    </label>
  );
}

// Khung panel trượt từ phải: overlay + header (Clear All / X) + body + footer CTA.
export function FilterSortPanel({ open, title = "Filter and sort", onClose, onClearAll, hasActive, ctaLabel, children }: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onClearAll?: () => void;
  hasActive: boolean;
  ctaLabel: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="h-full w-full max-w-sm flex flex-col" style={{ background: "#fff", boxShadow: "-12px 0 40px rgba(0,0,0,0.18)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>{title}</div>
          <div className="flex items-center gap-3">
            {hasActive && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
              >
                Clear All
              </button>
            )}
            <button type="button" onClick={onClose} style={{ color: COLORS.textSecondary, background: "none", border: "none", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        <div className="px-5 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="primary" size="md" className="w-full" onClick={onClose}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Nút mở panel — hiện badge tổng số filter đang active.
export function FilterSortButton({ activeCount, onClick, label = "Filter and sort" }: {
  activeCount: number;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all"
      style={{
        border: `1px solid ${activeCount > 0 ? COLORS.primary : COLORS.border}`,
        background: activeCount > 0 ? `${COLORS.primary}10` : COLORS.bg,
        color: activeCount > 0 ? COLORS.primary : COLORS.textPrimary,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <SlidersIcon />
      {label}
      {activeCount > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{ minWidth: 18, height: 18, background: COLORS.primary, color: "#fff", fontSize: 11, fontWeight: 700 }}
        >
          {activeCount}
        </span>
      )}
    </button>
  );
}

function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" />
      <line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  );
}
