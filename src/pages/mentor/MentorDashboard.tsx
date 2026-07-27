import { useEffect, useState } from "react";
import {
  MessageSquare, Users, Award, BookOpen, Loader, ChevronRight, AlertCircle, Target, Save,
  Search, X, CalendarDays, User
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  Button,
} from "@/components/shared/UIComponents";
import { MentorConsultations } from "./MentorConsultations";
import { useAuth } from "@/features/auth/store/authStore";
import { mentorDashboardService } from "@/features/mentor/api/mentorDashboardService";
import { type TeamResponse } from "@/features/teams/api/teamService";
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

/**
 * Giao diện chính của Mentor (Mentor Dashboard).
 * 
 * Tối ưu & Kiến trúc (BFF/Aggregate):
 * - Component này sử dụng một API duy nhất (`mentorDashboardService.getDashboardSummary`)
 *   để lấy cả danh sách Categories được phân công (assignedCategories) VÀ các Teams trực thuộc.
 * - Triệt tiêu được hiện tượng N+1 request Waterfall (trước đây phải gọi getEvents -> map gọi getCategories -> map gọi getMentors -> lọc).
 * - Code sạch hơn, hiệu suất tăng và giảm tải đáng kể cho backend database.
 */
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
  const [teamSearch, setTeamSearch] = useState("");
  const [filterEventId, setFilterEventId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");

  // ─── Fetch assigned categories — 1 aggregate call thay thế 50+ request ──────
  useEffect(() => {
    if (!user?.userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    mentorDashboardService.getDashboardSummary()
      .then(data => {
        if (cancelled) return;
        const mentorCats: MentorCategory[] = data.assignedCategories.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          description: cat.description,
          eventId: cat.eventId,
          eventName: cat.eventName,
          teamCount: cat.teamCount,
          isActive: cat.isActive,
        }));
        setCategories(mentorCats);
        setAllTeams(data.teams);
        if (mentorCats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(mentorCats[0].categoryId);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const filteredTeams = allTeams.filter((t) => {
    // Only include teams in categories the mentor is actually assigned to
    if (!categories.some((c) => c.categoryId === t.categoryId)) return false;

    if (filterEventId && t.eventId !== filterEventId) return false;
    if (filterCategoryId && t.categoryId !== filterCategoryId) return false;
    if (teamSearch) {
      const s = teamSearch.toLowerCase();
      if (!t.teamName.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalTeams = allTeams.filter((t) =>
    categories.some((c) => c.categoryId === t.categoryId)
  ).length;

  const selectedTeam = filteredTeams.find((t) => t.teamId === selectedTeamId) ?? null;

  const eventOptions = Array.from(new Set(categories.map((c) => c.eventId))).map((eid) => {
    return categories.find((c) => c.eventId === eid)!;
  });

  const categoryOptions = categories.filter((c) => !filterEventId || c.eventId === filterEventId);

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

    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <SectionHeader
          title="My Teams"
          subtitle="Manage and view information of teams you are mentoring"
        />

        <div className="flex gap-5 flex-1 min-h-0 mt-2">
          {/* Left panel: Filters & List */}
          <div className="w-1/3 flex flex-col gap-4 min-w-[320px]">
            {/* Filters */}
            <div className="flex flex-col gap-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none"
                  style={{ border: `1px solid ${COLORS.border}`, background: "var(--surface-input, #f9f6f1)", color: COLORS.textPrimary }}
                />
                {teamSearch && (
                  <button onClick={() => setTeamSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={filterEventId || "none"} onValueChange={(v) => { setFilterEventId(v === "none" ? "" : v); setFilterCategoryId(""); }}>
                    <SelectTrigger className="w-full text-sm h-9 rounded-xl outline-none bg-[var(--surface-input,#f9f6f1)]" style={{ border: `1px solid ${COLORS.border}` }}>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                      <SelectItem value="none">All Events</SelectItem>
                      {eventOptions.map(c => <SelectItem key={c.eventId} value={c.eventId}>{c.eventName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={filterCategoryId || "none"} onValueChange={(v) => setFilterCategoryId(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full text-sm h-9 rounded-xl outline-none bg-[var(--surface-input,#f9f6f1)]" style={{ border: `1px solid ${COLORS.border}` }}>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                      <SelectItem value="none">All Categories</SelectItem>
                      {categoryOptions.map(c => <SelectItem key={c.categoryId} value={c.categoryId}>{c.categoryName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-3">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-10" style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  No teams found.
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.teamId}
                    onClick={() => setSelectedTeamId(team.teamId)}
                    className="text-left rounded-2xl p-4 transition-all w-full flex flex-col"
                    style={{
                      background: selectedTeamId === team.teamId ? `${COLORS.success}10` : COLORS.card,
                      border: `1px solid ${selectedTeamId === team.teamId ? COLORS.success : COLORS.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1 w-full">
                      <span className="truncate pr-2" style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
                        {team.teamName}
                      </span>
                      <StatusBadge status="active" />
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {categories.find(c => c.categoryId === team.categoryId)?.categoryName}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Details */}
          <div className="w-2/3 flex flex-col min-h-0">
            {selectedTeam ? (
              <Card className="h-full flex flex-col overflow-hidden">
                <div className="p-6 shrink-0" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <div className="flex justify-between items-start mb-2">
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{selectedTeam.teamName}</h2>
                    <StatusBadge status={selectedTeam.teamStatusName as any || "active"} />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      <BookOpen size={14} />
                      <span>{categories.find(c => c.categoryId === selectedTeam.categoryId)?.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      <CalendarDays size={14} />
                      <span>Created {new Date(selectedTeam.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      <Users size={14} />
                      <span>{selectedTeam.members.length} members</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-[var(--surface-input,#f9f6f1)]">
                  <h3 className="mb-4" style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Team Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTeam.members.map((m, idx) => (
                      <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl bg-white" style={{ border: `1px solid ${COLORS.border}` }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: COLORS.primary, fontWeight: 700 }}>
                          <User size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                            Member {idx + 1} {m.userId === selectedTeam.leaderUserId && "(Leader)"}
                          </div>
                          <div className="truncate mt-0.5" style={{ fontSize: 11, color: COLORS.textSecondary }}>
                            Joined: {new Date(m.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center flex-col p-8 text-center bg-gray-50/50">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${COLORS.primary}10`, color: COLORS.primary }}>
                  <Users size={28} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>No Team Selected</div>
                <div style={{ fontSize: 14, color: COLORS.textSecondary, maxWidth: 300 }}>
                  Select a team from the list to view their detailed information and members.
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
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
