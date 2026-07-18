import { useState } from "react";
import { Users, User, Mail, Trash2, PlusCircle, Loader, Search } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { useCategoryContext } from "../../context/CategoryContext";

export function AssignMentorsTab() {
  const {
    categories,
    availableMentors,
    categoryMentors,
    assignMentors,
    removeMentor,
    loadCategoryMentors,
  } = useCategoryContext();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => categories[0]?.categoryId ?? ""
  );
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectedCategory = categories.find(c => c.categoryId === selectedCategoryId);
  const mentorsInCategory = categoryMentors[selectedCategoryId] ?? [];
  const assignedMentorIds = new Set(mentorsInCategory.map(m => m.mentorId));

  const filteredAvailable = availableMentors.filter(m => {
    const q = searchQuery.toLowerCase();
    const notAssigned = !assignedMentorIds.has(m.id);
    if (!q) return notAssigned;
    return notAssigned && (
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const handleAssign = async (mentorId: string) => {
    if (!selectedCategoryId) return;
    setAssigning(true);
    setError("");
    try {
      await assignMentors(selectedCategoryId, { mentorIds: [mentorId] });
      await loadCategoryMentors(selectedCategoryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign mentor");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (mentorId: string) => {
    if (!selectedCategoryId) return;
    setRemoving(mentorId);
    setError("");
    try {
      await removeMentor(selectedCategoryId, mentorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove mentor");
    } finally {
      setRemoving(null);
    }
  };

  if (categories.length === 0) {
    return (
      <Card className="p-12 text-center flex flex-col items-center gap-3" style={{ borderStyle: "dashed" }}>
        <Users size={32} style={{ color: COLORS.textSecondary, opacity: 0.4 }} />
        <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
          No categories found for this event. Create a category first.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(229,62,46,0.08)", color: "var(--destructive)", border: "1px solid rgba(229,62,46,0.2)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: category list */}
        <div className="space-y-2">
          <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Categories
          </div>
          {categories.map(cat => {
            const mCount = (categoryMentors[cat.categoryId] ?? []).length;
            const isActive = cat.categoryId === selectedCategoryId;
            return (
              <button
                key={cat.categoryId}
                onClick={() => {
                  setSelectedCategoryId(cat.categoryId);
                  setShowAssignPanel(false);
                  setSearchQuery("");
                }}
                className="w-full text-left p-3 rounded-xl transition-all"
                style={{
                  background: isActive ? `${COLORS.primary}12` : COLORS.bg,
                  border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                  outline: "none",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: isActive ? COLORS.primary : COLORS.textPrimary }}>
                  {cat.categoryName}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  {mCount} mentor{mCount !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: assigned mentors + assign panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>
              {selectedCategory?.categoryName ?? "—"} — Mentors
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={14} />}
              onClick={() => { setShowAssignPanel(v => !v); setSearchQuery(""); }}
              disabled={!selectedCategoryId}
            >
              Assign Mentor
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
                  placeholder="Search mentors by name or email…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: COLORS.textPrimary }}
                />
              </div>
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-3 text-sm" style={{ color: COLORS.textSecondary }}>
                  {availableMentors.length === 0 ? "No available mentors in the system." : "All matching mentors are already assigned."}
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {filteredAvailable.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: `${COLORS.primary}06`, border: `1px solid ${COLORS.border}` }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{m.fullName}</div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.email}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={assigning ? <Loader size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                        disabled={assigning}
                        onClick={() => handleAssign(m.id)}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Assigned mentors list */}
          {mentorsInCategory.length === 0 ? (
            <Card className="p-10 text-center flex flex-col items-center gap-2" style={{ borderStyle: "dashed" }}>
              <User size={24} style={{ color: COLORS.textSecondary, opacity: 0.4 }} />
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No mentors assigned to this category yet.</div>
            </Card>
          ) : (
            <div className="space-y-2">
              {mentorsInCategory.map(m => {
                const isRemoving = removing === m.mentorId;
                return (
                  <Card key={m.categoryMentorId} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                        style={{ background: `${COLORS.secondary}20`, color: COLORS.secondary }}
                      >
                        {(m.fullName ?? "M")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{m.fullName}</div>
                        <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                          <Mail size={12} />
                          {m.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={isRemoving ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      disabled={isRemoving}
                      onClick={() => handleRemove(m.mentorId)}
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
