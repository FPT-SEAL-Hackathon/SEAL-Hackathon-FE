import { useState } from "react";
import { Shield, User, Mail, Trash2, PlusCircle, Loader, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { useRoundContext } from "../../context/RoundContext";
import { useCategoryContext } from "../../context/CategoryContext";

export function AssignJudgesTab() {
  const {
    roundsByCategory,
    availableJudges,
    roundJudges,
    assignJudges,
    disableJudge,
    loadRoundJudges,
  } = useRoundContext();

  const { categories: allCategories } = useCategoryContext();
  const categoryNameMap = Object.fromEntries(allCategories.map(c => [c.categoryId, c.categoryName]));

  // Flatten categories from roundsByCategory keys
  const categoryIds = Object.keys(roundsByCategory);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => categoryIds[0] ?? ""
  );
  const [selectedRoundId, setSelectedRoundId] = useState<string>(() => {
    const rounds = Object.values(roundsByCategory)[0] ?? [];
    return rounds[0]?.roundId ?? "";
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(categoryIds.slice(0, 1))
  );
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const roundsForSelected = roundsByCategory[selectedCategoryId] ?? [];
  const judgesInRound = roundJudges[selectedRoundId] ?? [];
  const assignedJudgeIds = new Set(judgesInRound.map(j => j.judgeId));

  const filteredAvailable = availableJudges.filter(j => {
    const q = searchQuery.toLowerCase();
    const notAssigned = !assignedJudgeIds.has(j.judgeId);
    if (!q) return notAssigned;
    return notAssigned && (
      j.fullName?.toLowerCase().includes(q) ||
      j.email?.toLowerCase().includes(q)
    );
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectRound = (catId: string, roundId: string) => {
    setSelectedCategoryId(catId);
    setSelectedRoundId(roundId);
    setShowAssignPanel(false);
    setSearchQuery("");
  };

  const handleAssign = async (judgeId: string) => {
    if (!selectedRoundId) return;
    setAssigning(true);
    setError("");
    try {
      await assignJudges(selectedRoundId, { judgeIds: [judgeId] });
      await loadRoundJudges(selectedRoundId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign judge");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (roundJudgeId: string) => {
    if (!selectedRoundId) return;
    setRemoving(roundJudgeId);
    setError("");
    try {
      await disableJudge(selectedRoundId, roundJudgeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove judge");
    } finally {
      setRemoving(null);
    }
  };

  if (categoryIds.length === 0) {
    return (
      <Card className="p-12 text-center flex flex-col items-center gap-3" style={{ borderStyle: "dashed" }}>
        <Shield size={32} style={{ color: COLORS.textSecondary, opacity: 0.4 }} />
        <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
          No categories or rounds found. Please create categories and rounds first.
        </div>
      </Card>
    );
  }

  const selectedRound = roundsForSelected.find(r => r.roundId === selectedRoundId);

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(229,62,46,0.08)", color: "var(--destructive)", border: "1px solid rgba(229,62,46,0.2)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: category → rounds tree */}
        <div className="space-y-2">
          <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Rounds
          </div>
          {categoryIds.map(catId => {
            const rounds = roundsByCategory[catId] ?? [];
            const isExpanded = expandedCategories.has(catId);
            // We store categoryName from rounds[0].categoryId — use catId as fallback label
            const catLabel = catId.slice(0, 8) + "…";

            return (
              <div key={catId}>
                <button
                  onClick={() => toggleCategory(catId)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl transition-all"
                  style={{
                    background: selectedCategoryId === catId ? `${COLORS.primary}08` : COLORS.bg,
                    border: `1px solid ${selectedCategoryId === catId ? COLORS.primary : COLORS.border}`,
                    outline: "none",
                  }}
                >
                  {isExpanded
                    ? <ChevronDown size={14} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
                    : <ChevronRight size={14} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
                  }
                  <span style={{ fontWeight: 600, fontSize: 14, color: selectedCategoryId === catId ? COLORS.primary : COLORS.textPrimary, flex: 1, textAlign: "left" }}>
                    {categoryNameMap[catId] ?? catId.slice(0, 8) + "…"}
                  </span>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    {rounds.length} round{rounds.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {isExpanded && rounds.map(round => {
                  const isActive = round.roundId === selectedRoundId;
                  return (
                    <button
                      key={round.roundId}
                      onClick={() => selectRound(catId, round.roundId)}
                      className="w-full text-left pl-10 pr-3 py-2 rounded-xl transition-all"
                      style={{
                        background: isActive ? `${COLORS.primary}12` : COLORS.bg,
                        border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                        outline: "none",
                        marginTop: 6,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? COLORS.primary : COLORS.textPrimary }}>
                        {round.roundName}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                        Order #{round.roundOrder} • {(roundJudges[round.roundId] ?? []).length} judge{(roundJudges[round.roundId] ?? []).length !== 1 ? "s" : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Right: judges panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>
              {selectedRound ? selectedRound.roundName : "Select a round"} — Judges
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={14} />}
              onClick={() => { setShowAssignPanel(v => !v); setSearchQuery(""); }}
              disabled={!selectedRoundId}
            >
              Assign Judge
            </Button>
          </div>

          {/* Assign panel */}
          {showAssignPanel && (
            <Card className="p-4 space-y-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
              >
                <Search size={14} style={{ color: COLORS.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search judges by name or email…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: COLORS.textPrimary }}
                />
              </div>
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-3 text-sm" style={{ color: COLORS.textSecondary }}>
                  {availableJudges.length === 0 ? "No available judges in the system." : "All matching judges are already assigned or not available."}
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {filteredAvailable.map(j => (
                    <div
                      key={j.judgeId}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: `${COLORS.primary}06`, border: `1px solid ${COLORS.border}` }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{j.fullName}</div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{j.email}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={assigning ? <Loader size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                        disabled={assigning}
                        onClick={() => handleAssign(j.judgeId)}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Assigned judges list */}
          {!selectedRoundId ? (
            <Card className="p-10 text-center" style={{ borderStyle: "dashed" }}>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Select a round to view its judges.</div>
            </Card>
          ) : judgesInRound.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center gap-2" style={{ borderStyle: "dashed" }}>
              <User size={24} style={{ color: COLORS.textSecondary, opacity: 0.4 }} />
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No judges assigned to this round yet.</div>
            </Card>
          ) : (
            <div className="space-y-2">
              {judgesInRound.map(j => {
                const isRemoving = removing === j.roundJudgeId;
                return (
                  <Card key={j.roundJudgeId} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                        style={{ background: `${COLORS.primary}20`, color: COLORS.primary }}
                      >
                        {(j.fullName ?? "J")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{j.fullName}</div>
                        <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                          <Mail size={12} />
                          {j.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={isRemoving ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      disabled={isRemoving}
                      onClick={() => handleRemove(j.roundJudgeId)}
                    >
                      Remove
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
