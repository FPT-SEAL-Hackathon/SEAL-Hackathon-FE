import { useState, useEffect } from "react";
import { X, Save, Loader, Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { awardService, type RankingAwardCandidateResponse } from "@/features/awards/api/awardService";
import { ApiError } from "@/lib/api/apiClient";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  eventId: string;
  categoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

// Award tier IDs — replace with real UUIDs from your DB seed
const AWARD_TIERS = [
  { label: "🥇 Gold / First Prize", value: "00000000-0000-0000-0000-000000000021" },
  { label: "🥈 Silver / Second Prize", value: "00000000-0000-0000-0000-000000000022" },
  { label: "🥉 Bronze / Third Prize", value: "00000000-0000-0000-0000-000000000023" },
  { label: "🏅 Honorable Mention", value: "00000000-0000-0000-0000-000000000024" },
];

export function AwardModal({ eventId, categoryId, onClose, onSaved }: Props) {
  const [candidates, setCandidates] = useState<RankingAwardCandidateResponse[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [form, setForm] = useState({
    teamId: "",
    awardTierId: AWARD_TIERS[0].value,
    awardTitle: "",
    description: "",
    prizeValue: "",
    prizeCurrency: "VND",
  });
  const [autoGrantLimit, setAutoGrantLimit] = useState("3");
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!categoryId) return;
    setLoadingCandidates(true);
    awardService.getTopCandidates(categoryId, undefined, 10)
      .then(setCandidates)
      .catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, [categoryId]);

  const handleGrant = async () => {
    if (!form.teamId || !form.awardTitle) { setError("Team and award title are required."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await awardService.grant({
        eventId,
        categoryId: categoryId || undefined,
        teamId: form.teamId,
        awardTierId: form.awardTierId,
        awardTitle: form.awardTitle,
        description: form.description || undefined,
        prizeValue: form.prizeValue ? parseFloat(form.prizeValue) : undefined,
        prizeCurrency: form.prizeCurrency || undefined,
      });
      setSuccess("Award granted successfully!");
      setTimeout(onSaved, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to grant award.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGrant = async () => {
    if (!categoryId) { setError("Select a category first."); return; }
    setAutoLoading(true); setError(""); setSuccess("");
    try {
      const results = await awardService.autoGrant(categoryId, undefined, parseInt(autoGrantLimit) || 3);
      setSuccess(`Auto-granted ${results.length} award(s) successfully!`);
      setTimeout(onSaved, 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Auto-grant failed.");
    } finally {
      setAutoLoading(false);
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
          style={{ maxWidth: 560, background: COLORS.surface, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>Grant Award</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: COLORS.textSecondary }} /></button>
          </div>

          <div className="p-6 space-y-5">
            {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, color: COLORS.error }}>{error}</div>}
            {success && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.success}10`, color: COLORS.success }}>{success}</div>}

            {/* Auto-grant section */}
            {categoryId && (
              <div className="p-4 rounded-xl" style={{ background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}20` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: COLORS.primary }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Auto-Grant by Ranking</span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
                  Automatically grant awards to top-ranked teams based on configured award patterns.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label style={{ fontSize: 13, color: COLORS.textSecondary }}>Top</label>
                    <input type="number" value={autoGrantLimit} onChange={e => setAutoGrantLimit(e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg outline-none text-center"
                      style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg }} />
                    <label style={{ fontSize: 13, color: COLORS.textSecondary }}>teams</label>
                  </div>
                  <button onClick={handleAutoGrant} disabled={autoLoading}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: COLORS.primary, opacity: autoLoading ? 0.7 : 1 }}>
                    {autoLoading ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
                    Auto-Grant
                  </button>
                </div>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, marginBottom: 16 }}>
                Manual Grant
              </div>

              {/* Top candidates quick-pick */}
              {candidates.length > 0 && (
                <div className="mb-4">
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>QUICK PICK — TOP RANKED TEAMS</label>
                  <div className="space-y-1">
                    {candidates.slice(0, 5).map(c => (
                      <button key={c.teamId} onClick={() => setForm(p => ({ ...p, teamId: c.teamId, awardTitle: `${["1st", "2nd", "3rd", "4th", "5th"][c.rankPosition - 1] ?? c.rankPosition + "th"} Place — ${c.teamName}` }))}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors hover:bg-gray-50"
                        style={{ border: `1px solid ${form.teamId === c.teamId ? COLORS.primary : COLORS.border}`, background: form.teamId === c.teamId ? `${COLORS.primary}08` : COLORS.bg }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>#{c.rankPosition} {c.teamName}</span>
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{c.totalScore.toFixed(1)} pts</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>TEAM ID (UUID) *</label>
                  <input value={form.teamId} onChange={e => setForm(p => ({ ...p, teamId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl outline-none font-mono"
                    style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>AWARD TIER *</label>
                  <select value={form.awardTierId} onChange={e => setForm(p => ({ ...p, awardTierId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                    {AWARD_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>AWARD TITLE *</label>
                  <input value={form.awardTitle} onChange={e => setForm(p => ({ ...p, awardTitle: e.target.value }))}
                    placeholder="1st Place — AI Innovation Track"
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>PRIZE VALUE</label>
                    <input type="number" value={form.prizeValue} onChange={e => setForm(p => ({ ...p, prizeValue: e.target.value }))}
                      placeholder="200000000"
                      className="w-full px-3 py-2.5 rounded-xl outline-none"
                      style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>CURRENCY</label>
                    <select value={form.prizeCurrency} onChange={e => setForm(p => ({ ...p, prizeCurrency: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl outline-none"
                      style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>DESCRIPTION</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              Cancel
            </button>
            <button onClick={handleGrant} disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={14} className="animate-spin" /> : <Trophy size={14} />}
              {loading ? "Granting..." : "Grant Award"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
