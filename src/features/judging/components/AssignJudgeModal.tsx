import { useState } from "react";
import { X, Save, Loader, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { roundService } from "@/features/judging/api/roundService";
import { ApiError } from "@/lib/api/apiClient";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  roundId: string;
  roundName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AssignJudgeModal({ roundId, roundName, onClose, onSaved }: Props) {
  const [judgeIds, setJudgeIds] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRow = () => setJudgeIds(p => [...p, ""]);
  const removeRow = (i: number) => setJudgeIds(p => p.filter((_, idx) => idx !== i));
  const setRow = (i: number, v: string) => setJudgeIds(p => p.map((id, idx) => idx === i ? v : id));

  const handleSave = async () => {
    const valid = judgeIds.filter(id => id.trim().length > 0);
    if (valid.length === 0) { setError("Enter at least one Judge User ID."); return; }
    setLoading(true); setError("");
    try {
      await roundService.assignJudges(roundId, valid);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign judges.");
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
          style={{ maxWidth: 480, background: COLORS.surface, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>Assign Judges</h3>
              <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{roundName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: COLORS.textSecondary }} /></button>
          </div>

          <div className="p-6 space-y-4">
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, color: COLORS.error }}>{error}</div>}

            <p style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Enter the User IDs of judges to assign to this round. Each ID is a UUID from the user database.
            </p>

            <div className="space-y-2">
              {judgeIds.map((id, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={id} onChange={e => setRow(i, e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="flex-1 px-3 py-2.5 rounded-xl outline-none font-mono"
                    style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
                  {judgeIds.length > 1 && (
                    <button onClick={() => removeRow(i)} className="p-2 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} style={{ color: COLORS.error }} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addRow} className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50"
              style={{ color: COLORS.primary, border: `1px dashed ${COLORS.primary}40` }}>
              <Plus size={14} /> Add another judge
            </button>
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
              {loading ? "Assigning..." : "Assign Judges"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
