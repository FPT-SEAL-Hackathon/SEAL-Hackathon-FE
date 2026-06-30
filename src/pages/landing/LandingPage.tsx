import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Star, Crown, Flame, Zap, Users, Calendar,
  ArrowRight, Award, Target, Clock, MapPin, Shield, Hash, Loader
} from "lucide-react";
import { api } from "@/lib/api/apiClient";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { awardService, type TotalPrizeSummary } from "@/features/awards/api/awardService";

interface Props {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

// ─── Hall of Fame API type (matches backend HallOfFameResponse) ──────────────
interface HallOfFameResponse {
  eventName: string;
  categoryName: string;
  teamName: string;
  awardTierName: string;  // e.g. "GOLD", "SILVER", "BRONZE"
  awardTitle: string;
  leaderName: string;
}

const ORANGE_WHITE = "linear-gradient(135deg, #F47920 0%, #FF9040 55%, #FFE8D4 100%)";
const ORANGE_PRIMARY = "linear-gradient(135deg, #F47920, #FF9040)";

// Hall of Fame data is fetched from API.

interface LandingCompetition {
  id: string;
  name: string;
  status: "ongoing" | "upcoming" | "completed";
  phase: string;
  startDate: string;
  endDate: string;
  registrationEnd?: string;
  location: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  color: string;
  gradient: string;
  description: string;
}

interface LandingStats {
  events: string;
  teams: string;
  prizeMoney: string;
  topProjects: string;
}

interface TeamCountResponse {
  totalTeams: number;
}

const EVENT_COLORS = [
  { color: "#F47920", gradient: "from-orange-500/20 to-amber-400/10" },
  { color: "#7C3AED", gradient: "from-violet-500/20 to-purple-400/10" },
  { color: "#0EA5E9", gradient: "from-sky-500/20 to-blue-400/10" },
];

const EVENT_STATUS = {
  UPCOMING: "30000000-0000-0000-0000-000000000002",
  ONGOING: "30000000-0000-0000-0000-000000000003",
  COMPLETED: "30000000-0000-0000-0000-000000000004",
};

const RANK_META = [
  { bg: "from-yellow-400/30 to-amber-300/20", border: "border-yellow-400/50", text: "text-yellow-600", label: "Champion" },
  { bg: "from-slate-300/30 to-gray-200/20",   border: "border-slate-400/50",  text: "text-slate-600",  label: "Runner-up" },
  { bg: "from-orange-300/30 to-amber-200/20", border: "border-orange-400/50", text: "text-orange-600", label: "3rd Place" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ongoing") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-600 border border-orange-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      Live
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
      <Trophy size={10} />
      Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-600 border border-blue-500/30">
      <Clock size={10} />
      Upcoming
    </span>
  );
}

function ParticleField() {
  const particles = [
    ...Array(24)
  ].map((_, i) => ({
    w: (i * 7 % 4) + 2,
    h: (i * 5 % 4) + 2,
    left: ((i * 37 + 11) % 100),
    top: ((i * 53 + 17) % 100),
    color: i % 3 === 0 ? "#F47920" : i % 3 === 1 ? "#FFD0A0" : "#FF9040",
    dur: 4 + (i % 4),
    delay: (i * 3) % 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{ width: p.w, height: p.h, left: `${p.left}%`, top: `${p.top}%`, background: p.color, opacity: 0.3 }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Group flat HallOfFame list by eventName ─────────────────────────────────
const TIER_ORDER: Record<string, number> = { gold: 0, champion: 0, first: 0, silver: 1, second: 1, bronze: 2, third: 2 };
function tierRank(tierName: string): number {
  const key = tierName.toLowerCase();
  for (const k of Object.keys(TIER_ORDER)) if (key.includes(k)) return TIER_ORDER[k];
  return 99;
}

interface HofGroup {
  groupKey: string;
  eventName: string;
  categoryName: string;
  podium: Array<HallOfFameResponse & { rank: number; entryKey: string }>;
}

function stableKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function groupHallOfFame(data: HallOfFameResponse[]): HofGroup[] {
  const map = new Map<string, HofGroup>();
  for (const item of data) {
    const key = `${item.eventName}||${item.categoryName}`;
    if (!map.has(key)) map.set(key, { groupKey: `hof-${stableKey(key)}`, eventName: item.eventName, categoryName: item.categoryName, podium: [] });
    map.get(key)!.podium.push({ ...item, rank: 0, entryKey: "" });
  }
  const groups = Array.from(map.values());
  for (const g of groups) {
    g.podium.sort((a, b) => tierRank(a.awardTierName) - tierRank(b.awardTierName));
    g.podium = g.podium.slice(0, 3).map((p, i) => ({
      ...p,
      rank: i + 1,
      entryKey: `${g.groupKey}-entry-${stableKey(`${p.awardTierName}|${p.awardTitle}|${p.leaderName}|${i}`)}`,
    }));
  }
  return groups.slice(0, 3);
}

function toCompetition(event: EventResponse, index: number): LandingCompetition {
  const dates = getEventDates(event);
  const palette = EVENT_COLORS[index % EVENT_COLORS.length];
  return {
    id: event.eventId,
    name: event.eventName,
    status: getCompetitionStatus(event, dates.startDate, dates.endDate),
    phase: getCompetitionPhase(event, dates.startDate, dates.endDate),
    startDate: dates.startDate,
    endDate: dates.endDate,
    registrationEnd: event.registrationEnd,
    location: event.location || "N/A",
    minTeamSize: event.minTeamSize,
    maxTeamSize: event.maxTeamSize,
    color: palette.color,
    gradient: palette.gradient,
    description: event.description || "N/A",
  };
}

function getEventDates(event: EventResponse) {
  return {
    startDate: event.eventStartDate || event.registrationStart || event.createdAt,
    endDate: event.eventEndDate || event.registrationEnd || event.eventStartDate || event.createdAt,
  };
}

function pickLandingCompetitions(events: EventResponse[]): EventResponse[] {
  const byCreatedDesc = (a: EventResponse, b: EventResponse) => parseDateTime(b.createdAt) - parseDateTime(a.createdAt);
  const byStartAsc = (a: EventResponse, b: EventResponse) => parseDateTime(getEventDates(a).startDate) - parseDateTime(getEventDates(b).startDate);

  const ongoing = events
    .filter(event => getCompetitionStatus(event, getEventDates(event).startDate, getEventDates(event).endDate) === "ongoing")
    .sort(byCreatedDesc)
    .slice(0, 2);

  const upcoming = events
    .filter(event => {
      const dates = getEventDates(event);
      return getCompetitionStatus(event, dates.startDate, dates.endDate) === "upcoming" && !hasEnded(dates.endDate);
    })
    .sort(byStartAsc)
    .slice(0, 1);

  return [...ongoing, ...upcoming];
}

function hasEnded(endDate: string): boolean {
  const end = parseDateTime(endDate);
  return Number.isFinite(end) && end > 0 && end < Date.now();
}

function getCompetitionStatus(event: EventResponse, startDate: string, endDate: string): LandingCompetition["status"] {
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.ONGOING) return "ongoing";
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.UPCOMING) return "upcoming";
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.COMPLETED) return "completed";

  const now = Date.now();
  const start = parseDateTime(startDate);
  const end = parseDateTime(endDate);
  if (Number.isFinite(end) && now > end) return "completed";
  if (Number.isFinite(start) && now < start) return "upcoming";
  return "ongoing";
}

function getCompetitionPhase(event: EventResponse, startDate: string, endDate: string): string {
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.COMPLETED) return "Completed";
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.ONGOING) return "In Progress";
  if (event.eventStatus?.eventStatusId === EVENT_STATUS.UPCOMING) return "Registration Open";

  const now = Date.now();
  const regEnd = event.registrationEnd ? parseDateTime(event.registrationEnd) : NaN;
  const start = parseDateTime(startDate);
  const end = parseDateTime(endDate);
  if (Number.isFinite(end) && now > end) return "Completed";
  if (Number.isFinite(regEnd) && now <= regEnd) return "Registration Open";
  if (Number.isFinite(start) && now < start) return "Coming Soon";
  return "In Progress";
}

function formatDate(date: string): string {
  if (!date) return "N/A";
  const parsed = new Date(normalizeDateTime(date));
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US");
}

function parseDateTime(date: string): number {
  if (!date) return 0;
  const timestamp = new Date(normalizeDateTime(date)).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeDateTime(date: string): string {
  return date.includes(" ") ? date.replace(" ", "T") : date;
}

async function getPublicTeamCount() {
  const response = await api.get<TeamCountResponse>("/api/v1/public/teams/count", false);
  return response.totalTeams;
}

function formatPrizeMoney(summary: TotalPrizeSummary): string {
  if (summary.totalPrizes?.length) {
    return summary.totalPrizes
      .filter(item => item.totalPrize && item.totalPrize > 0)
      .map(item => formatPrizeAmount(item.totalPrize, item.prizeCurrency))
      .join(" + ") || "N/A";
  }
  const { totalPrize, currency } = summary;
  if (!totalPrize || totalPrize === 0) return "N/A";
  return formatPrizeAmount(totalPrize, currency);
}

function formatPrizeAmount(totalPrize: number, currency?: string): string {
  const cur = (currency || "VND").toUpperCase();
  let display: string;
  if (totalPrize >= 1_000_000_000) {
    display = `${(totalPrize / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  } else if (totalPrize >= 1_000_000) {
    display = `${(totalPrize / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  } else if (totalPrize >= 1_000) {
    display = `${(totalPrize / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  } else {
    display = totalPrize.toLocaleString();
  }
  return `${display} ${cur}`;
}

export function LandingPage({ onGoToLogin, onGoToRegister }: Props) {
  const [activeCompetition, setActiveCompetition] = useState(0);
  const [competitions, setCompetitions] = useState<LandingCompetition[]>([]);
  const [stats, setStats] = useState<LandingStats>({
    events: "N/A",
    teams: "N/A",
    prizeMoney: "N/A",
    topProjects: "N/A",
  });
  const [competitionsLoading, setCompetitionsLoading] = useState(true);
  const [competitionsError, setCompetitionsError] = useState("");
  const [activeHof, setActiveHof] = useState(0);
  const [hofGroups, setHofGroups] = useState<HofGroup[]>([]);
  const [hofLoading, setHofLoading] = useState(true);

  useEffect(() => {
    if (competitions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCompetition(v => (v + 1) % competitions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [competitions.length]);

  useEffect(() => {
    eventService.getPublic()
      .then(data => {
        const mapped = pickLandingCompetitions(data).map(toCompetition);
        setCompetitions(mapped);
        setStats(prev => ({ ...prev, events: String(data.length) }));
        setCompetitionsError("");
        setActiveCompetition(0);
      })
      .catch((error) => {
        console.error("Failed to load landing events", error);
        setCompetitionsError(error instanceof Error ? error.message : "Failed to load events.");
        setCompetitions([]);
        setStats(prev => ({ ...prev, events: "N/A" }));
      })
      .finally(() => setCompetitionsLoading(false));
  }, []);

  useEffect(() => {
    getPublicTeamCount()
      .then(teamCount => setStats(prev => ({ ...prev, teams: String(teamCount) })))
      .catch(() => setStats(prev => ({ ...prev, teams: "N/A" })));
  }, []);

  // Fetch total prize money across all events
  useEffect(() => {
    awardService.getTotalPrize()
      .then(summary => setStats(prev => ({ ...prev, prizeMoney: formatPrizeMoney(summary) })))
      .catch(() => setStats(prev => ({ ...prev, prizeMoney: "N/A" })));
  }, []);

  // Fetch Hall of Fame from real API
  useEffect(() => {
    api.get<HallOfFameResponse[]>("/api/v1/public/hall-of-fame", false)
      .then(data => {
        setHofGroups(groupHallOfFame(data));
        setStats(prev => ({ ...prev, topProjects: String(data.length) }));
      })
      .catch(() => { /* keep empty, show fallback */ })
      .finally(() => setHofLoading(false));
  }, []);

  const currentCompetition = competitions[activeCompetition];
  const heroBadgeText = currentCompetition
    ? `${currentCompetition.name} is ${currentCompetition.status}`
    : "N/A";

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}>

      {/* ─── Sticky Nav ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ORANGE_PRIMARY }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em", background: ORANGE_WHITE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                SEAL
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">Hackathon Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: "nav-competitions", href: "#competitions", label: "Competitions" },
              { id: "nav-hall-of-fame", href: "#hall-of-fame", label: "Hall of Fame" },
              { id: "nav-stats", href: "#stats", label: "Stats" },
            ].map(item => (
              <a key={item.id} href={item.href}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/40 transition-all">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onGoToLogin}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/40 transition-all">
              Sign In
            </button>
            <button onClick={onGoToRegister}
              className="px-4 py-2 rounded-xl text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: ORANGE_PRIMARY }}>
              Register Now
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-6 overflow-hidden">
        <ParticleField />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #F47920, transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{ background: "radial-gradient(circle, #FFD0A0, transparent)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-orange-400/30 mb-8">
            <Flame size={14} style={{ color: "#F47920" }} />
            <span className="text-sm" style={{ color: "#F47920", fontWeight: 500 }}>
              {heroBadgeText}
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Where{" "}
            <span style={{ background: "linear-gradient(135deg, #F47920 0%, #FF8C2A 50%, #FFD0A0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Tech Talent
            </span>
            <br />Shines
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto mb-10"
            style={{ fontSize: "1.15rem", lineHeight: 1.7 }}>
            FPT's leading hackathon platform — where students compete, innovate, and write their names into the SEAL Hall of Fame.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onGoToRegister}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95 shadow-lg"
              style={{ background: ORANGE_WHITE, boxShadow: "0 8px 32px rgba(244,121,32,0.35)" }}>
              <Zap size={18} />
              Join Now
            </button>
            <button onClick={() => document.getElementById("hall-of-fame")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass border border-orange-400/25 text-foreground hover:bg-white/50 transition-all">
              <Trophy size={18} style={{ color: "#F47920" }} />
              View Hall of Fame
            </button>
          </motion.div>

          {/* Floating stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { id: "hero-events", icon: Trophy, value: stats.events, label: "Events Hosted" },
              { id: "hero-teams", icon: Users, value: stats.teams, label: "Teams" },
              { id: "hero-prize", icon: Award, value: stats.prizeMoney, label: "Total Prize" },
              { id: "hero-projects", icon: Star, value: stats.topProjects, label: "Top Projects" },
            ].map((s, i) => (
              <div key={s.id} className="glass rounded-2xl p-4 text-center">
                <s.icon size={20} className="mx-auto mb-1" style={{ color: "#F47920" }} />
                <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "#F47920" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Competitions ──────────────────────────────────────── */}
      <section id="competitions" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-orange-400/30 mb-4">
              <Target size={14} style={{ color: "#F47920" }} />
              <span className="text-sm" style={{ color: "#F47920", fontWeight: 500 }}>Competitions</span>
            </div>
            <h2 className="mb-3">Tech Arena</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ongoing and upcoming competitions — your opportunity to prove your talent and enter the Hall of Fame.
            </p>
          </motion.div>

          {competitionsLoading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader size={20} className="animate-spin" style={{ color: "#F47920" }} />
              <span className="text-sm">Loading events...</span>
            </div>
          )}

          {!competitionsLoading && competitions.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{competitionsError || "No events available yet."}</p>
            </div>
          )}

          {!competitionsLoading && competitions.length > 0 && <div className="flex flex-wrap justify-center gap-2 mb-8">
            {competitions.map((c, i) => (
              <button key={c.id} onClick={() => setActiveCompetition(i)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${activeCompetition === i ? "text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"}`}
                style={activeCompetition === i ? { background: c.color } : {}}>
                {c.name.split("–")[0].trim()}
              </button>
            ))}
          </div>}

          <AnimatePresence mode="wait">
            <motion.div key={activeCompetition} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              {(() => {
                const c = competitions[activeCompetition];
                if (!c) return null;
                return (
                  <div className="glass rounded-3xl overflow-hidden border border-white/30 max-w-4xl mx-auto">
                    <div className={`bg-gradient-to-r ${c.gradient} border-b border-white/20 px-8 py-6`}>
                      <div>
                        <StatusBadge status={c.status} />
                        <h3 className="mt-2 mb-1">{c.name}</h3>
                        <p className="text-muted-foreground text-sm">{c.description}</p>
                      </div>
                    </div>

                    <div className="px-8 py-6 grid sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="text-sm font-medium">
                              {formatDate(c.startDate)} - {formatDate(c.endDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div className="text-sm font-medium">{c.location}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Team Size</div>
                            <div className="text-sm font-medium">
                              {c.maxTeamSize ? `${c.minTeamSize ? `${c.minTeamSize} - ` : "Up to "}${c.maxTeamSize} members` : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Hash size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Phase</div>
                            <div className="text-sm font-medium">{c.phase}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Registration Deadline</div>
                        <div className="rounded-xl border px-4 py-3 text-sm font-medium"
                          style={{ borderColor: c.color + "40", color: c.color, background: c.color + "12" }}>
                          {c.registrationEnd ? formatDate(c.registrationEnd) : "N/A"}
                        </div>
                        <button onClick={onGoToRegister}
                          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90"
                          style={{ background: c.color }}>
                          {c.status === "completed" ? "View Results" : c.status === "ongoing" ? "View Details" : "Register to Participate"}
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {competitions.map((c, i) => (
              <motion.button key={c.id} onClick={() => setActiveCompetition(i)}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-2xl glass border text-left transition-all hover:scale-[1.02] ${activeCompetition === i ? "border-orange-400/40" : "border-white/20"}`}>
                <StatusBadge status={c.status} />
                <div className="mt-2 text-sm font-medium line-clamp-2">{c.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(c.startDate)} - {formatDate(c.endDate)}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Hall of Fame ──────────────────────────────────────── */}
      <section id="hall-of-fame" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #F47920, #FFD700, #F47920, transparent)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #FFD700, #FF9040, #FFD700, transparent)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
            style={{ background: "radial-gradient(circle, #FFD700, transparent)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-yellow-400/40 mb-4">
              <Crown size={14} style={{ color: "#F4A320" }} />
              <span className="text-sm" style={{ color: "#D4A020", fontWeight: 500 }}>Hall of Fame</span>
            </div>
            <h2 className="mb-3">
              Hall of{" "}
              <span style={{ background: "linear-gradient(135deg, #FFD700, #F47920, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Fame
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The names that made SEAL history - highlights from the 3 latest competitions.
            </p>
          </motion.div>

          {/* Loading state */}
          {hofLoading && (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader size={20} className="animate-spin" style={{ color: "#F47920" }} />
              <span className="text-sm">Loading data...</span>
            </div>
          )}

          {/* Empty state (API returned no data) */}
          {!hofLoading && hofGroups.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No Hall of Fame data available yet.</p>
            </div>
          )}

          {/* Event/category selector */}
          {!hofLoading && hofGroups.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {hofGroups.map((g, i) => (
                  <button key={g.groupKey} onClick={() => setActiveHof(i)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${activeHof === i ? "text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"}`}
                    style={activeHof === i ? { background: "linear-gradient(135deg, #F47920, #FFD700)" } : {}}>
                    <span className="hidden sm:inline">{g.eventName} — {g.categoryName}</span>
                    <span className="sm:hidden">{g.categoryName}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeHof} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
                  {/* Podium — order: 2nd left, 1st center, 3rd right */}
                  <div className="flex flex-col md:flex-row items-end justify-center gap-4 max-w-4xl mx-auto">
                    {(() => {
                      const podium = hofGroups[activeHof]?.podium ?? [];
                      const displayOrder = podium.length >= 3 ? [1, 0, 2] : podium.length === 2 ? [1, 0] : [0];
                      return displayOrder.map((rankIdx) => {
                        const entry = podium[rankIdx];
                        if (!entry) return null;
                        const meta = RANK_META[rankIdx];
                        const isFirst = rankIdx === 0;
                        const initials = entry.teamName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                        return (
                          <motion.div key={entry.entryKey}
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: rankIdx === 0 ? 0.1 : rankIdx === 1 ? 0 : 0.2 }}
                            className={`flex-1 max-w-sm rounded-3xl border ${meta.border} bg-gradient-to-b ${meta.bg} glass p-6 relative ${isFirst ? "md:scale-105 md:-translate-y-4 z-10" : ""}`}>
                            {isFirst && (
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                                  <Crown size={36} style={{ color: "#FFD700", filter: "drop-shadow(0 0 8px #FFD70088)" }} />
                                </motion.div>
                              </div>
                            )}

                            <div className="text-center mb-4 mt-2">
                              <div className={`text-xs font-semibold mb-1 ${meta.text}`}>{meta.label}</div>
                              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-lg font-bold text-white mb-2"
                                style={{ background: isFirst ? "linear-gradient(135deg, #FFD700, #F47920)" : ORANGE_PRIMARY }}>
                                {initials}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{entry.teamName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{entry.awardTierName}</div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="p-3 rounded-xl bg-white/30 border border-white/40">
                                <div className="text-xs text-muted-foreground mb-0.5">Award</div>
                                <div className="font-medium text-xs leading-snug">{entry.awardTitle}</div>
                              </div>
                              <div className="text-xs text-muted-foreground px-1 pt-1">
                                {entry.categoryName}
                              </div>
                            </div>

                            {isFirst && (
                              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                                style={{ boxShadow: "0 0 40px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,215,0,0.3)" }} />
                            )}
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────── */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: "stats-competitions", icon: Trophy, value: stats.events, label: "Competitions", sub: "from API", color: "#F47920" },
              { id: "stats-teams", icon: Users, value: stats.teams, label: "Teams", sub: "from API", color: "#FF8C2A" },
              { id: "stats-projects", icon: Star, value: stats.topProjects, label: "Projects", sub: "from Hall of Fame", color: "#7C3AED" },
              { id: "stats-prize", icon: Award, value: stats.prizeMoney, label: "Prize Money", sub: "from API", color: "#0EA5E9" },
            ].map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center border border-white/25 hover:scale-105 transition-transform">
                <s.icon size={28} className="mx-auto mb-3" style={{ color: s.color }} />
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }} className="mt-0.5">{s.label}</div>
                {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto glass rounded-3xl p-12 border border-white/30"
          style={{ boxShadow: "0 24px 64px rgba(244,121,32,0.12)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
            style={{ background: ORANGE_WHITE }}>
            <Trophy size={28} className="text-white" />
          </div>
          <h2 className="mb-3">Ready to Make History?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Sign in to view your competition details, or register to step into the SEAL Tech Arena.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onGoToLogin}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: ORANGE_WHITE, boxShadow: "0 8px 32px rgba(244,121,32,0.35)" }}>
              <Zap size={18} />
              Sign In / Register
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/15">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ORANGE_PRIMARY }}>
              <Shield size={14} className="text-white" />
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, background: ORANGE_WHITE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              SEAL Hackathon Platform
            </span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 FPT University. Where tech talent shines.</p>
        </div>
      </footer>
    </div>
  );
}
