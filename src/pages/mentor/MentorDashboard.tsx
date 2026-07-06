import { useEffect, useState } from "react";
import {
  CheckCircle, Circle, MessageSquare, Target,
  Users, Save, Award, BookOpen, Loader, ChevronRight, AlertCircle, PlusCircle, Trash2
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  Button,
} from "@/components/shared/UIComponents";
import { MentorConsultations } from "./MentorConsultations";
import { useAuth } from "@/features/auth/store/authStore";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { teamService, type TeamResponse } from "@/features/teams/api/teamService";
import { eventService } from "@/features/events/api/eventService";
import { milestoneService, type MilestoneResponse } from "@/features/teams/api/milestoneService";
import { meService } from "@/features/users/api/userService";
import { saveUser } from "@/lib/api/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MentorCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  eventId: string;
  eventName: string;
  teamCount: number;
  isActive: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MentorDashboard({
  currentPage,
  onNavigate,
}: {
  currentPage: string;
  onNavigate: (p: string) => void;
}) {
  const { user, setAuth } = useAuth();

  // ─ Data state ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<MentorCategory[]>([]);
  const [allTeams, setAllTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─ Teams page state ────────────────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // ─ Milestone state (API-backed) ──────────────────────────────────────────────
  const [milestoneStore, setMilestoneStore] = useState<Record<string, MilestoneResponse[]>>({});
  const [milestoneLoading, setMilestoneLoading] = useState<Record<string, boolean>>({});
  const [newMilestoneText, setNewMilestoneText] = useState("");

  // ─ Profile state ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.fullName ?? "Mentor",
    email: user?.email ?? "",
    expertise: "",
    institution: user?.universityName ?? "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ─── Fetch assigned categories ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Get all events
        const events = await eventService.getAll().catch(() => [] as any[]);

        // 2. For each event, get categories and check if this mentor is assigned
        const eventMap = Object.fromEntries(events.map((e: any) => [e.eventId, e.eventName ?? e.eventId]));

        // Fetch all categories across all events in parallel
        const categoryLists = await Promise.all(
          events.map((e: any) =>
            categoryService.getByEvent(e.eventId).catch(() => [] as CategoryResponse[])
          )
        );
        const allCategories = categoryLists.flat();

        // 3. For each category, check if the current mentor is assigned
        const assignmentChecks = await Promise.all(
          allCategories.map(async (cat) => {
            try {
              const mentors = await categoryService.getMentors(cat.categoryId);
              const isAssigned = Array.isArray(mentors) && mentors.some(
                (m) => m.mentorId === user.userId
              );
              return isAssigned ? cat : null;
            } catch {
              return null;
            }
          })
        );

        const assignedCategories = assignmentChecks.filter((c): c is CategoryResponse => c !== null);

        if (cancelled) return;

        // 4. Load teams for each assigned category's event (deduplicated)
        const eventIds = [...new Set(assignedCategories.map((c) => c.eventId))];
        const teamLists = await Promise.all(
          eventIds.map((eid) =>
            teamService.getByEvent(eid).catch(() => [] as TeamResponse[])
          )
        );
        const teams = teamLists.flat();

        if (cancelled) return;

        // 5. Build mentor category view with team counts
        const mentorCats: MentorCategory[] = assignedCategories.map((cat) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          description: cat.description,
          eventId: cat.eventId,
          eventName: eventMap[cat.eventId] ?? cat.eventId,
          teamCount: teams.filter((t) => t.categoryId === cat.categoryId).length,
          isActive: cat.isActive,
        }));

        setCategories(mentorCats);
        setAllTeams(teams);

        // Auto-select first category for teams page
        if (mentorCats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(mentorCats[0].categoryId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const teamsInSelectedCategory = allTeams.filter(
    (t) => t.categoryId === selectedCategoryId
  );

  const totalTeams = allTeams.filter((t) =>
    categories.some((c) => c.categoryId === t.categoryId)
  ).length;

  const selectedTeam = teamsInSelectedCategory.find((t) => t.teamId === selectedTeamId) ?? null;

  // ─── Save note ─────────────────────────────────────────────────────────────
  const saveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  // ─── Milestone helpers (API-backed) ──────────────────────────────────────────
  const getMilestonesForTeam = (teamId: string): MilestoneResponse[] =>
    milestoneStore[teamId] ?? [];

  const loadMilestonesForTeam = async (teamId: string) => {
    if (milestoneStore[teamId] !== undefined) return; // already loaded
    setMilestoneLoading((p) => ({ ...p, [teamId]: true }));
    try {
      const data = await milestoneService.getByTeam(teamId);
      setMilestoneStore((p) => ({ ...p, [teamId]: data }));
    } catch {
      // fallback: keep empty array so UI renders
      setMilestoneStore((p) => ({ ...p, [teamId]: [] }));
    } finally {
      setMilestoneLoading((p) => ({ ...p, [teamId]: false }));
    }
  };

  const toggleMilestone = async (teamId: string, milestoneId: string) => {
    // Optimistic update
    setMilestoneStore((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] ?? []).map((m) =>
        m.milestoneId === milestoneId ? { ...m, isDone: !m.isDone } : m
      ),
    }));
    try {
      const updated = await milestoneService.toggle(teamId, milestoneId);
      setMilestoneStore((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] ?? []).map((m) =>
          m.milestoneId === updated.milestoneId ? updated : m
        ),
      }));
    } catch {
      // revert on failure — reload from server
      const fresh = await milestoneService.getByTeam(teamId).catch(() => (prev: { [x: string]: any; }) => prev[teamId] ?? []);
      setMilestoneStore((prev) => ({ ...prev, [teamId]: Array.isArray(fresh) ? fresh : prev[teamId] }));
    }
  };

  const addMilestone = async (teamId: string) => {
    const label = newMilestoneText.trim();
    if (!label) return;
    try {
      const created = await milestoneService.create(teamId, label);
      setMilestoneStore((prev) => ({
        ...prev,
        [teamId]: [...(prev[teamId] ?? []), created],
      }));
      setNewMilestoneText("");
    } catch (err) {
      console.error("Failed to add milestone", err);
    }
  };

  const removeMilestone = async (teamId: string, milestoneId: string) => {
    // Optimistic remove
    setMilestoneStore((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] ?? []).filter((m) => m.milestoneId !== milestoneId),
    }));
    try {
      await milestoneService.delete(teamId, milestoneId);
    } catch {
      // reload on failure
      const fresh = await milestoneService.getByTeam(teamId).catch(() => []);
      setMilestoneStore((prev) => ({ ...prev, [teamId]: fresh }));
    }
  };

  // ─── Profile save ────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const updatedData = await meService.updateMe({
        fullName: profileForm.name.trim(),
        phone: profileForm.institution ? undefined : undefined, // phone not in form yet
        universityName: profileForm.institution.trim() || undefined,
      });
      if (user) {
        const mergedUser = { ...user, ...updatedData };
        setAuth(mergedUser);
        saveUser(mergedUser);
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Loading / Error states ────────────────────────────────────────────────
  const renderLoading = () => (
    <Card className="p-8">
      <div className="flex items-center gap-3" style={{ color: COLORS.textSecondary }}>
        <Loader size={18} className="animate-spin" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Loading your assigned categories...</span>
      </div>
    </Card>
  );

  const renderError = () => (
    <Card className="p-6">
      <div className="flex items-center gap-3" style={{ color: COLORS.error }}>
        <AlertCircle size={18} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{error}</span>
      </div>
    </Card>
  );

  // ─── Render: Categories ────────────────────────────────────────────────────
  const renderCategories = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    return (
      <>
        <SectionHeader
          title="Assigned Categories"
          subtitle={
            categories.length === 0
              ? "You have not been assigned to any category yet."
              : `${categories.length} categor${categories.length === 1 ? "y" : "ies"} assigned`
          }
        />

        {categories.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen size={36} style={{ color: COLORS.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, color: COLORS.textSecondary }}>
              No categories assigned yet. Contact the organizer.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {categories.map((cat) => (
              <Card key={cat.categoryId} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>
                      {cat.categoryName}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{cat.eventName}</div>
                  </div>
                  <StatusBadge status={cat.isActive ? "active" : "inactive"} />
                </div>
                {cat.description && (
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
                    {cat.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Teams: </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                      {cat.teamCount}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronRight size={13} />}
                    onClick={() => {
                      setSelectedCategoryId(cat.categoryId);
                      setSelectedTeamId(null);
                      setNoteText("");
                      onNavigate("teams");
                    }}
                  >
                    View Teams
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Overview summary */}
        {categories.length > 0 && (
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
              Expert Overview
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Categories", value: categories.length, color: COLORS.primary },
                { label: "Total Teams", value: totalTeams, color: COLORS.secondary },
                { label: "Active Categories", value: categories.filter((c) => c.isActive).length, color: COLORS.success },
                { label: "Events", value: new Set(categories.map((c) => c.eventId)).size, color: COLORS.accent },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: `${s.color}10` }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </>
    );
  };

  // ─── Render: Teams ─────────────────────────────────────────────────────────
  const renderTeams = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    const activeCat = categories.find((c) => c.categoryId === selectedCategoryId);

    return (
      <>
        <SectionHeader
          title="Category Teams"
          subtitle={activeCat ? `Teams in "${activeCat.categoryName}" — ${activeCat.eventName}` : "Select a category"}
        />

        {/* Category selector (if mentor has multiple categories) */}
        {categories.length > 1 && (
          <Card className="p-4">
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>
              FILTER BY CATEGORY
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={() => {
                    setSelectedCategoryId(cat.categoryId);
                    setSelectedTeamId(null);
                    setNoteText("");
                  }}
                  className="px-3 py-1.5 rounded-xl text-sm transition-all"
                  style={{
                    background: selectedCategoryId === cat.categoryId ? `${COLORS.success}15` : COLORS.bg,
                    border: `1px solid ${selectedCategoryId === cat.categoryId ? COLORS.success : COLORS.border}`,
                    color: selectedCategoryId === cat.categoryId ? COLORS.success : COLORS.textSecondary,
                    fontWeight: selectedCategoryId === cat.categoryId ? 600 : 400,
                  }}
                >
                  {cat.categoryName}
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: selectedCategoryId === cat.categoryId ? `${COLORS.success}20` : `${COLORS.border}40`,
                    }}
                  >
                    {cat.teamCount}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {teamsInSelectedCategory.length === 0 ? (
          <Card className="p-8 text-center">
            <Users size={36} style={{ color: COLORS.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, color: COLORS.textSecondary }}>
              {selectedCategoryId
                ? "No teams in this category yet."
                : "Select a category to view teams."}
            </div>
          </Card>
        ) : (
          <>
            {/* Team list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {teamsInSelectedCategory.map((team) => (
                <button
                  key={team.teamId}
                  onClick={() => {
                    setSelectedTeamId(team.teamId);
                    setNoteText("");
                  }}
                  className="text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: selectedTeamId === team.teamId ? `${COLORS.success}10` : COLORS.card,
                    border: `1px solid ${selectedTeamId === team.teamId ? COLORS.success : COLORS.border}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
                      {team.teamName}
                    </span>
                    <StatusBadge status="active" />
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                  </div>
                </button>
              ))}
            </div>

            {/* Consultation notes + Milestones panel */}
            {selectedTeam && (() => {
              // Load milestones from API when team is selected
              void loadMilestonesForTeam(selectedTeam.teamId);
              const teamMilestones = getMilestonesForTeam(selectedTeam.teamId);
              const doneCount = teamMilestones.filter((m) => m.isDone).length;
              const isLoadingMilestones = milestoneLoading[selectedTeam.teamId];
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* ── Milestones ── */}
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                        {selectedTeam.teamName} — Milestones
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: doneCount === teamMilestones.length && teamMilestones.length > 0
                            ? `${COLORS.success}20`
                            : `${COLORS.primary}12`,
                          color: doneCount === teamMilestones.length && teamMilestones.length > 0
                            ? COLORS.success
                            : COLORS.primary,
                        }}
                      >
                        {doneCount}/{teamMilestones.length} done
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full mb-4"
                      style={{ height: 4, background: `${COLORS.border}60` }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: teamMilestones.length
                            ? `${(doneCount / teamMilestones.length) * 100}%`
                            : "0%",
                          background: COLORS.success,
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      {isLoadingMilestones ? (
                        <div className="flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
                          <Loader size={14} className="animate-spin" />
                          <span style={{ fontSize: 13 }}>Loading milestones...</span>
                        </div>
                      ) : teamMilestones.length === 0 ? (
                        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                          No milestones yet. Add one below.
                        </div>
                      ) : (
                        teamMilestones.map((m) => (
                          <div
                            key={m.milestoneId}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 group transition-colors"
                            style={{
                              background: m.isDone ? `${COLORS.success}08` : COLORS.bg,
                              border: `1px solid ${m.isDone ? COLORS.success + "40" : COLORS.border}`,
                            }}
                          >
                            <button
                              onClick={() => toggleMilestone(selectedTeam.teamId, m.milestoneId)}
                              style={{ flexShrink: 0, lineHeight: 0 }}
                              title={m.isDone ? "Mark as not done" : "Mark as done"}
                            >
                              {m.isDone ? (
                                <CheckCircle size={18} style={{ color: COLORS.success }} />
                              ) : (
                                <Circle size={18} style={{ color: COLORS.border }} />
                              )}
                            </button>
                            <span
                              className="flex-1"
                              style={{
                                fontSize: 14,
                                color: m.isDone ? COLORS.textSecondary : COLORS.textPrimary,
                                textDecoration: m.isDone ? "line-through" : "none",
                                fontWeight: m.isDone ? 400 : 500,
                              }}
                            >
                              {m.label}
                            </span>
                            <button
                              onClick={() => removeMilestone(selectedTeam.teamId, m.milestoneId)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: COLORS.error, lineHeight: 0 }}
                              title="Remove milestone"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add milestone */}
                    <div className="flex gap-2 mt-4">
                      <input
                        value={newMilestoneText}
                        onChange={(e) => setNewMilestoneText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addMilestone(selectedTeam.teamId);
                        }}
                        placeholder="Add milestone..."
                        className="flex-1 px-3 py-2 rounded-xl outline-none"
                        style={{
                          fontSize: 13,
                          border: `1px solid ${COLORS.border}`,
                          background: COLORS.bg,
                          color: COLORS.textPrimary,
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<PlusCircle size={13} />}
                        onClick={() => addMilestone(selectedTeam.teamId)}
                        disabled={!newMilestoneText.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </Card>

                  {/* ── Consultation Notes ── */}
                  <Card className="p-5">
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 }}>
                      Consultation Notes
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
                      Private notes for {selectedTeam.teamName}
                    </div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                      style={{
                        fontSize: 14,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.bg,
                        color: COLORS.textPrimary,
                      }}
                      placeholder="Add consultation notes, observations, and recommendations..."
                    />
                    <div className="flex items-center gap-3 mt-3">
                      <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={saveNote}>
                        Save Notes
                      </Button>
                      {noteSaved && (
                        <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Saved!</span>
                      )}
                    </div>
                  </Card>

                </div>
              );
            })()}
          </>
        )}
      </>
    );
  };

  // ─── Render: Dashboard (Progress) ──────────────────────────────────────────
  const renderDashboard = () => {
    if (loading) return renderLoading();
    if (error) return renderError();

    return (
      <>
        <SectionHeader
          title="Expert Dashboard"
          subtitle="Overview of your assigned categories and teams"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Categories"
            value={categories.length}
            icon={<BookOpen size={20} />}
            color={COLORS.primary}
          />
          <StatCard
            title="Total Teams"
            value={totalTeams}
            icon={<Users size={20} />}
            color={COLORS.success}
          />
          <StatCard
            title="Active Categories"
            value={categories.filter((c) => c.isActive).length}
            icon={<Target size={20} />}
            color={COLORS.secondary}
          />
          <StatCard
            title="Events"
            value={new Set(categories.map((c) => c.eventId)).size}
            icon={<Award size={20} />}
            color={COLORS.warning}
          />
        </div>

        {/* Per-category summary cards */}
        {categories.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen size={36} style={{ color: COLORS.border, margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, color: COLORS.textSecondary }}>
              No categories assigned yet. Contact the organizer.
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const catTeams = allTeams.filter((t) => t.categoryId === cat.categoryId);
              return (
                <Card key={cat.categoryId} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                        {cat.categoryName}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                        {cat.eventName}
                      </div>
                    </div>
                    <StatusBadge status={cat.isActive ? "active" : "inactive"} />
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${COLORS.primary}12`, color: COLORS.primary }}
                    >
                      {catTeams.length} team{catTeams.length !== 1 ? "s" : ""}
                    </span>
                    {cat.description && (
                      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{cat.description}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MessageSquare size={13} />}
                      onClick={() => {
                        setSelectedCategoryId(cat.categoryId);
                        setSelectedTeamId(null);
                        setNoteText("");
                        onNavigate("teams");
                      }}
                    >
                      View Teams
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // ─── Render: Profile ───────────────────────────────────────────────────────
  const renderProfile = () => (
    <>
      <SectionHeader title="Expert Profile" subtitle="Manage your profile and expert settings" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 text-center col-span-1">
          <div
            className="mx-auto flex items-center justify-center rounded-full text-white mb-4"
            style={{
              width: 72,
              height: 72,
              background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.secondary})`,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {profileForm.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase() || "M"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>
            {profileForm.name}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            Expert • {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </div>
          <div className="mt-4 space-y-2 text-left">
            {[
              { label: "Categories", value: categories.map((c) => c.categoryName).join(", ") || "None" },
              { label: "Teams", value: `${totalTeams} assigned` },
              { label: "Institution", value: profileForm.institution || "-" },
              { label: "Email", value: profileForm.email || "-" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
                  {item.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-2">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>
              Profile Settings
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Expertise", key: "expertise" },
                { label: "Institution", key: "institution" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    value={profileForm[field.key as keyof typeof profileForm]}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, [field.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{
                      fontSize: 14,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.bg,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{
                  fontSize: 14,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.bg,
                  color: COLORS.textPrimary,
                }}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon={profileSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              className="mt-4"
              onClick={saveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </Button>
            {profileSaved && (
              <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600, marginTop: 8, display: "block" }}>✓ Profile saved!</span>
            )}
            {profileError && (
              <span style={{ fontSize: 13, color: COLORS.error, fontWeight: 500, marginTop: 8, display: "block" }}>{profileError}</span>
            )}
          </Card>
        </div>
      </div>
    </>
  );

  // ─── Page router ───────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return renderDashboard();
      case "categories":
      case "tracks":
        return renderCategories();
      case "teams":
        return renderTeams();
      case "progress":
        return renderDashboard();
      case "profile":
        return renderProfile();
      case "consultations":
        return <MentorConsultations onNavigate={onNavigate} />;
      default:
        return renderDashboard();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
