import { useState } from "react";
import { X, Save, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { roundService, type RoundResponse } from "@/features/judging/api/roundService";
import { ApiError } from "@/lib/api/apiClient";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  categoryId: string;
  round?: RoundResponse | null;
  onClose: () => void;
  onSaved: (round: RoundResponse) => void;
}

const ROUND_STATUS_OPTIONS = [
  { label: "Upcoming", value: "00000000-0000-0000-0000-000000000011" },
  { label: "Open (Accepting Submissions)", value: "00000000-0000-0000-0000-000000000012" },
  { label: "Scoring / In Progress", value: "00000000-0000-0000-0000-000000000013" },
  { label: "Completed", value: "00000000-0000-0000-0000-000000000014" },
];

export function RoundModal({ categoryId, round, onClose, onSaved }: Props) {
  const isEdit = !!round;
  const [form, setForm] = useState({
    roundName: round?.roundName ?? "",
    description: round?.description ?? "",
    roundOrder: String(round?.roundOrder ?? 1),
    roundStatusId: round?.roundStatusId ?? ROUND_STATUS_OPTIONS[0].value,
    submissionDeadline: round?.submissionDeadline?.slice(0, 16) ?? "",
    judgingDeadline: round?.judgingDeadline?.slice(0, 16) ?? "",
    startDate: round?.startDate?.slice(0, 16) ?? "",
    endDate: round?.endDate?.slice(0, 16) ?? "",
    advancementTopN: String(round?.advancementTopN ?? ""),
    isCalibrationRound: round?.isCalibrationRound ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.roundName.trim()) { setError("Round name is required."); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        roundName: form.roundName,
        description: form.description || "",
        roundOrder: parseInt(form.roundOrder) || 1,
        roundStatusId: form.roundStatusId || undefined,
        submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline).toISOString() : undefined,
        judgingDeadline: form.judgingDeadline ? new Date(form.judgingDeadline).toISOString() : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        advancementTopN: form.advancementTopN ? parseInt(form.advancementTopN) : undefined,
        isCalibrationRound: form.isCalibrationRound,
      };
      const result = isEdit
        ? await roundService.update(round!.roundId, payload)
        : await roundService.create(categoryId, payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ maxWidth: 560, background: COLORS.bg, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>{isEdit ? "Edit Round" : "New Round"}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: COLORS.textSecondary }} /></button>
          </div>

          <div className="p-6 space-y-4">
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, color: COLORS.error }}>{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>ROUND NAME *</label>
                <input value={form.roundName} onChange={e => set("roundName", e.target.value)} placeholder="Round 1 — Qualifying"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>ORDER</label>
                <input type="number" value={form.roundOrder} onChange={e => set("roundOrder", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>STATUS</label>
                <select value={form.roundStatusId} onChange={e => set("roundStatusId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  {ROUND_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>DESCRIPTION</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
                className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>START DATE</label>
                <input type="datetime-local" value={form.startDate} onChange={e => set("startDate", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>END DATE</label>
                <input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>SUBMISSION DEADLINE</label>
                <input type="datetime-local" value={form.submissionDeadline} onChange={e => set("submissionDeadline", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>JUDGING DEADLINE</label>
                <input type="datetime-local" value={form.judgingDeadline} onChange={e => set("judgingDeadline", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>ADVANCE TOP N TEAMS</label>
                <input type="number" value={form.advancementTopN} onChange={e => set("advancementTopN", e.target.value)}
                  placeholder="e.g. 10" className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input type="checkbox" id="calibration" checked={form.isCalibrationRound}
                  onChange={e => set("isCalibrationRound", e.target.checked)}
                  className="w-4 h-4" style={{ accentColor: COLORS.primary }} />
                <label htmlFor="calibration" style={{ fontSize: 13, color: COLORS.textPrimary }}>Calibration Round</label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Round"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
