import { useState, useEffect } from "react";
import { X, Search, UserCheck, UserMinus, Loader } from "lucide-react";
import { Button, COLORS } from "@/components/shared/UIComponents";
import { categoryService } from "@/features/categories/api/categoryService";
import { userService } from "@/features/users/api/userService";

interface AssignMentorModalProps {
  categoryId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignMentorModal({ categoryId, onClose, onAssigned }: AssignMentorModalProps) {
  const [tab, setTab] = useState<"add" | "assigned">("add");

  // --- "Add" tab state ---
  const [allMentors, setAllMentors] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // --- "Assigned" tab state ---
  const [assigned, setAssigned] = useState<any[]>([]);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  // Fetch all available mentors/experts
  useEffect(() => {
    setLoadingAll(true);
    userService
      .getUsers({ role: "Expert", size: 200 })
      .then((res) => setAllMentors(res.content ?? []))
      .catch(() => setError("Failed to load mentors"))
      .finally(() => setLoadingAll(false));
  }, []);

  // Fetch already-assigned mentors
  const loadAssigned = () => {
    setLoadingAssigned(true);
    categoryService
      .getMentors(categoryId)
      .then((list) => setAssigned(list))
      .catch(() => setError("Failed to load assigned experts"))
      .finally(() => setLoadingAssigned(false));
  };

  useEffect(() => {
    loadAssigned();
  }, [categoryId]);

  // Already-assigned mentor IDs to grey them out in "Add" tab
  const assignedMentorIds = new Set(assigned.map((a) => a.mentorId ?? a.expertId ?? a.userId));

  const filteredAll = allMentors.filter((m) => {
    const name = (m.fullName ?? "").toLowerCase();
    const email = (m.email ?? "").toLowerCase();
    const q = addSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const filteredAssigned = assigned.filter((a) => {
    const name = (a.mentorName ?? a.expertName ?? a.fullName ?? "").toLowerCase();
    const email = (a.mentorEmail ?? a.expertEmail ?? a.email ?? "").toLowerCase();
    const q = assignedSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one expert");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await categoryService.assignMentors(categoryId, selectedIds);
      setSelectedIds([]);
      loadAssigned();
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign experts");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (mentorId: string) => {
    setRemovingId(mentorId);
    setError("");
    try {
      await categoryService.removeMentor(categoryId, mentorId);
      loadAssigned();
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove expert");
    } finally {
      setRemovingId(null);
    }
  };

  const TAB_STYLE = (active: boolean) => ({
    padding: "8px 18px",
    borderRadius: 10,
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    cursor: "pointer",
    background: active ? COLORS.primary : "transparent",
    color: active ? "#fff" : COLORS.textSecondary,
    border: "none",
    transition: "all 0.2s",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: "82vh" }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex justify-between items-center"
          style={{ borderColor: COLORS.border }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>
            Manage Experts for Category
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} color={COLORS.textSecondary} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-2" style={{ background: COLORS.bg }}>
          <button style={TAB_STYLE(tab === "add")} onClick={() => setTab("add")}>
            Add Experts
          </button>
          <button style={TAB_STYLE(tab === "assigned")} onClick={() => setTab("assigned")}>
            Assigned ({assigned.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {/* ── ADD TAB ── */}
          {tab === "add" && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl outline-none border focus:border-primary/50 transition-colors"
                  style={{
                    borderColor: COLORS.border,
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* List */}
              <div className="space-y-2">
                {loadingAll ? (
                  <div className="flex justify-center p-8">
                    <Loader size={24} className="animate-spin text-primary" />
                  </div>
                ) : filteredAll.length === 0 ? (
                  <div className="text-center p-8 text-sm text-gray-500">No experts found</div>
                ) : (
                  filteredAll.map((mentor) => {
                    const alreadyAssigned = assignedMentorIds.has(mentor.userId);
                    const selected = selectedIds.includes(mentor.userId);
                    return (
                      <div
                        key={mentor.userId}
                        onClick={() => !alreadyAssigned && toggleSelect(mentor.userId)}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                        style={{
                          borderColor: alreadyAssigned
                            ? COLORS.border
                            : selected
                            ? COLORS.primary
                            : COLORS.border,
                          background: alreadyAssigned
                            ? "#f9fafb"
                            : selected
                            ? `${COLORS.primary}08`
                            : "transparent",
                          cursor: alreadyAssigned ? "not-allowed" : "pointer",
                          opacity: alreadyAssigned ? 0.6 : 1,
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            selected && !alreadyAssigned
                              ? "bg-primary border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {selected && !alreadyAssigned && <UserCheck size={14} color="white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                            {mentor.fullName}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{mentor.email}</div>
                        </div>
                        {alreadyAssigned && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${COLORS.primary}15`, color: COLORS.primary, fontWeight: 600 }}
                          >
                            Assigned
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── ASSIGNED TAB ── */}
          {tab === "assigned" && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assigned experts..."
                  value={assignedSearch}
                  onChange={(e) => setAssignedSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl outline-none border focus:border-primary/50 transition-colors"
                  style={{
                    borderColor: COLORS.border,
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    fontSize: 14,
                  }}
                />
              </div>

              <div className="space-y-2">
                {loadingAssigned ? (
                  <div className="flex justify-center p-8">
                    <Loader size={24} className="animate-spin text-primary" />
                  </div>
                ) : filteredAssigned.length === 0 ? (
                  <div className="text-center p-8 text-sm text-gray-500">No experts assigned yet</div>
                ) : (
                  filteredAssigned.map((a) => {
                    const mentorId = a.mentorId ?? a.expertId ?? "";
                    const name = a.mentorName ?? a.expertName ?? a.fullName ?? "Unknown";
                    const email = a.mentorEmail ?? a.expertEmail ?? a.email ?? "";
                    const isRemoving = removingId === mentorId;
                    return (
                      <div
                        key={a.categoryMentorId ?? mentorId}
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ borderColor: COLORS.border }}
                      >
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{email}</div>
                        </div>
                        <button
                          onClick={() => handleRemove(mentorId)}
                          disabled={isRemoving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50"
                          style={{ color: "#ef4444", border: "1px solid #fecaca" }}
                          title="Remove expert from category"
                        >
                          {isRemoving ? (
                            <Loader size={13} className="animate-spin" />
                          ) : (
                            <UserMinus size={13} />
                          )}
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex justify-end gap-3"
          style={{ borderColor: COLORS.border, background: COLORS.bg }}
        >
          <Button variant="ghost" onClick={onClose} disabled={assigning}>
            Close
          </Button>
          {tab === "add" && (
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={assigning || selectedIds.length === 0}
              icon={assigning ? <Loader size={16} className="animate-spin" /> : <UserCheck size={16} />}
            >
              Assign Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
