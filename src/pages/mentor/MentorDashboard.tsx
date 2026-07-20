import { useEffect, useState } from "react";
import {
  MessageSquare, Users, Award, BookOpen, Loader, ChevronRight, AlertCircle, Target, Save
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
import { MyProfileSection } from "@/features/users/components/MyProfileSection";

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

  // (Milestone and note logic moved to MentorConsultations detail view)

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {teamsInSelectedCategory.map((team) => (
              <button
                key={team.teamId}
                onClick={() => setSelectedTeamId(team.teamId)}
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                          {cat.categoryName}
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-200 uppercase tracking-wider">
                          Role: Mentor
                        </span>
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
  // Form ho so dung chung: load/save qua API /api/v1/me that
  // (form cu thieu phone, co field Bio/Expertise khong ton tai o BE).
  const renderProfile = () => (
    <>
      <SectionHeader title="Expert Profile" subtitle="Update your personal information" />
      <MyProfileSection />
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
