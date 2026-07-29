import { useState, useEffect } from "react";
import { X, Search, UserCheck, Loader, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { roundService } from "@/features/judging/api/roundService";
import { userService } from "@/features/users/api/userService";
import { categoryService } from "@/features/categories/api/categoryService";
import { parseApiError } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  roundId: string;
  roundName: string;
  onClose: () => void;
  onSaved: () => void;
}

const ASSIGNABLE_ROLES = new Set(["MENTOR", "EXPERT", "INTERNAL_JUDGE", "GUEST_JUDGE"]);

function normalizeRole(role?: string | null) {
  return String(role ?? "").toUpperCase().replace(/^ROLE_/, "").replace(/[\s-]+/g, "_");
}

function isAssignableRole(user: { role?: string | null; roleName?: string | null }) {
  return ASSIGNABLE_ROLES.has(normalizeRole(user.role)) || ASSIGNABLE_ROLES.has(normalizeRole(user.roleName));
}

export function AssignJudgeModal({ roundId, roundName, onClose, onSaved }: Props) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [assignedMap, setAssignedMap] = useState<Map<string, string>>(new Map());
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [categoryMentorIds, setCategoryMentorIds] = useState<Set<string>>(new Set());

  const handleRemove = async (userId: string) => {
    const roundJudgeId = assignedMap.get(userId);
    if (!roundJudgeId) return;
    
    setRemovingId(userId);
    setError("");
    try {
      await roundService.disableJudge(roundJudgeId);
      // Refresh list to update UI
      const res = await roundService.getJudges(roundId);
      const newMap = new Map<string, string>();
      const newIds = new Set<string>();
      (res as any[]).forEach((j: any) => {
        newMap.set(j.judgeId, j.roundJudgeId);
        newIds.add(j.judgeId);
      });
      setAssignedMap(newMap);
      setAssignedIds(newIds);
      onSaved();
    } catch (err) {
      const errMsg = parseApiError(err).message;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    roundService.getById(roundId)
      .then(round => {
        return Promise.all([
          userService.getJudges(),
          roundService.getJudges(roundId),
          categoryService.getMentors(round.categoryId),
        ]);
      })
      .then(([judgesRes, assignedJudges, assignedMentors]) => {
        const combined = judgesRes.content || [];
        const unique = Array.from(new Map(combined.map(u => [u.userId, u])).values())
          .filter(isAssignableRole);
        setCandidates(unique);
        
        const map = new Map<string, string>();
        const ids = new Set<string>();
        (assignedJudges as any[]).forEach((j: any) => {
          const uId = j.userId ?? j.judgeId ?? "";
          ids.add(uId);
          map.set(uId, j.roundJudgeId);
        });
        setAssignedIds(ids);
        setAssignedMap(map);
        
        const mentorIds = new Set<string>();
        assignedMentors.forEach((m: any) => mentorIds.add(m.mentorId || m.expertId));
        setCategoryMentorIds(mentorIds);
      })
      .catch((err) => {
        const errMsg = parseApiError(err).message || "Failed to load judges and mentors";
        setError(errMsg);
        toast.error(errMsg);
      })
      .finally(() => setLoading(false));
  }, [roundId]);

  const filteredCandidates = candidates
    .filter(u =>
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aAssigned = assignedIds.has(a.userId);
      const bAssigned = assignedIds.has(b.userId);
      if (aAssigned === bAssigned) return 0;
      return aAssigned ? 1 : -1;
    });

  const toggleSelection = (id: string) => {
    if (assignedIds.has(id)) return; // already assigned, not selectable
    if (categoryMentorIds.has(id)) return; // is mentor, not selectable
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one judge/mentor");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await roundService.assignJudges(roundId, selectedIds);
      setSelectedIds([]);
      onSaved();
    } catch (err) {
      const errMsg = parseApiError(err).message;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full rounded-2xl overflow-hidden flex flex-col"
          style={{ maxWidth: 500, maxHeight: "80vh", background: COLORS.bg, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>Assign Judges</h3>
              <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{roundName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: COLORS.textSecondary }} /></button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, color: COLORS.error, border: `1px solid ${COLORS.error}20` }}>
                {error}
              </div>
            )}

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl outline-none border focus:border-primary/50 transition-colors"
                style={{ borderColor: COLORS.border, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 14 }}
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center p-8"><Loader size={24} className="animate-spin text-primary" /></div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center p-8 text-sm text-gray-500">No judges or mentors found</div>
              ) : (
                filteredCandidates.map(user => {
                  const roleLabel = user.roleName ?? normalizeRole(user.role).replace(/_/g, " ");
                  const alreadyAssigned = assignedIds.has(user.userId);
                  const isCategoryMentor = categoryMentorIds.has(user.userId);
                  const selected = selectedIds.includes(user.userId);
                  const disabled = alreadyAssigned || isCategoryMentor;

                  return (
                    <div
                      key={user.userId}
                      onClick={() => toggleSelection(user.userId)}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{
                        borderColor: disabled ? COLORS.border : selected ? COLORS.primary : COLORS.border,
                        background: disabled ? "#f9fafb" : selected ? `${COLORS.primary}05` : "transparent",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.6 : 1,
                      }}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selected && !disabled ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        {selected && !disabled && <UserCheck size={14} color="white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                            {user.fullName}
                          </span>
                          {roleLabel && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${COLORS.success}20`, color: COLORS.success }}>
                              {roleLabel}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.email}</div>
                      </div>
                      
                      {alreadyAssigned && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: `${COLORS.primary}15`, color: COLORS.primary, fontWeight: 600 }}
                        >
                          Assigned
                        </span>
                      )}
                      
                      {!alreadyAssigned && isCategoryMentor && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: `#f59e0b15`, color: "#d97706", fontWeight: 600 }}
                        >
                          Already mentor for this category
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <button onClick={onClose} disabled={assigning} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={assigning || selectedIds.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, opacity: (assigning || selectedIds.length === 0) ? 0.7 : 1 }}>
              {assigning ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              Assign Selected ({selectedIds.length})
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
