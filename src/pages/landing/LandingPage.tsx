import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Star, Crown, Flame, Zap, Users, Calendar,
  ArrowRight, Award, Target, Clock, MapPin, Shield, Hash, Loader,
  Image as ImageIcon, Camera, Mail, Phone, ExternalLink, X, Maximize2, Sparkles, Globe
} from "lucide-react";
import { type TotalPrizeSummary } from "@/features/awards/api/awardService";
import { type EventResponse } from "@/features/events/api/eventService";
import { publicSummaryService } from "@/features/public/api/publicSummaryService";
import { loadLandingSettings, type LandingPageSettingsData } from "@/pages/admin/components/AdminLandingSettingsView";

/**
 * Giao diện Landing Page (Trang chủ công khai).
 * 
 * Tối ưu & Kiến trúc (BFF/Aggregate):
 * Thay vì gọi 4-5 API riêng biệt để lấy danh sách giải thưởng, danh sách sự kiện, tổng số đội,
 * Component này sử dụng một API duy nhất (`publicSummaryService.getLandingSummary`) để fetch
 * toàn bộ dữ liệu cần thiết trong một lần tải trang. Việc này giúp:
 * - Tránh lỗi N+1 request ở Frontend.
 * - Loại bỏ hiện tượng chớp màn hình (waterfall loading).
 * - Cải thiện tốc độ load (SEO & Performance).
 */
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
  { bg: "from-slate-300/30 to-gray-200/20", border: "border-slate-400/50", text: "text-slate-600", label: "Runner-up" },
  { bg: "from-orange-300/30 to-amber-200/20", border: "border-orange-400/50", text: "text-orange-600", label: "3rd Place" },
];

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  url: string;
  spanClass: string;
  description: string;
  isFeatured?: boolean;
}

const GALLERY_IMAGES: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Grand Finals Main Stage",
    category: "Opening & Expo",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    spanClass: "md:col-span-2 md:row-span-2 min-h-[320px] md:min-h-[440px]",
    description: "The grand opening ceremony & live team presentations at SEAL Hackathon Arena.",
    isFeatured: true,
  },
  {
    id: "gal-2",
    title: "24h Intensive Hackathon",
    category: "Team Coding Lab",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-2 md:row-span-1 min-h-[210px]",
    description: "Developers collaborating non-stop to solve real-world tech challenges.",
  },
  {
    id: "gal-3",
    title: "Expert Mentorship",
    category: "1-on-1 Guidance",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
    spanClass: "md:col-span-1 md:row-span-1 min-h-[210px]",
    description: "Industry leaders advising teams on system architecture and UX.",
  },
  {
    id: "gal-4",
    title: "Judge Pitch Defense",
    category: "Evaluation",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
    spanClass: "md:col-span-1 md:row-span-1 min-h-[210px]",
    description: "Teams presenting prototype solutions to expert judges.",
  },
  {
    id: "gal-5",
    title: "Champion Award Ceremony",
    category: "Victory & Prizes",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-2 md:row-span-1 min-h-[210px]",
    description: "Honoring winning teams and presenting grand prize trophies.",
  },
  {
    id: "gal-6",
    title: "Developer Community Expo",
    category: "Networking",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    spanClass: "md:col-span-2 md:row-span-1 min-h-[210px]",
    description: "Connecting student innovators with recruiters and tech sponsors.",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ongoing") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-black/90 text-orange-600 border border-orange-500/40 shadow-sm backdrop-blur-md">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      Live
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-black/90 text-emerald-600 border border-emerald-500/40 shadow-sm backdrop-blur-md">
      <Trophy size={11} />
      Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-black/90 text-blue-600 border border-blue-500/40 shadow-sm backdrop-blur-md">
      <Clock size={11} />
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

function isPodiumAward(item: HallOfFameResponse): boolean {
  return tierRank(`${item.awardTierName} ${item.awardTitle}`) < 3;
}

interface HofGroup {
  groupKey: string;
  eventName: string;
  categoryName: string;
  podium: Array<HallOfFameResponse & { rank: number; entryKey: string }>;
  specialAwards: Array<HallOfFameResponse & { entryKey: string }>;
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
    if (!map.has(key)) {
      map.set(key, { groupKey: `hof-${stableKey(key)}`, eventName: item.eventName, categoryName: item.categoryName, podium: [], specialAwards: [] });
    }
    const group = map.get(key)!;
    if (isPodiumAward(item)) {
      group.podium.push({ ...item, rank: 0, entryKey: "" });
    } else {
      group.specialAwards.push({
        ...item,
        entryKey: `${group.groupKey}-special-${stableKey(`${item.awardTierName}|${item.awardTitle}|${item.teamName}|${item.leaderName}`)}`,
      });
    }
  }
  const groups = Array.from(map.values());
  for (const g of groups) {
    g.podium.sort((a, b) => tierRank(a.awardTierName) - tierRank(b.awardTierName));
    g.podium = g.podium.slice(0, 3).map((p, i) => ({
      ...p,
      rank: i + 1,
      entryKey: `${g.groupKey}-entry-${stableKey(`${p.awardTierName}|${p.awardTitle}|${p.leaderName}|${i}`)}`,
    }));
    g.specialAwards = g.specialAwards.slice(0, 4);
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
  const statusId = typeof event.eventStatus === 'object' ? event.eventStatus?.eventStatusId : event.eventStatus;
  if (statusId === EVENT_STATUS.ONGOING) return "ongoing";
  if (statusId === EVENT_STATUS.UPCOMING) return "upcoming";
  if (statusId === EVENT_STATUS.COMPLETED) return "completed";

  const now = Date.now();
  const start = parseDateTime(startDate);
  const end = parseDateTime(endDate);
  if (Number.isFinite(end) && now > end) return "completed";
  if (Number.isFinite(start) && now < start) return "upcoming";
  return "ongoing";
}

function getCompetitionPhase(event: EventResponse, startDate: string, endDate: string): string {
  const statusId = typeof event.eventStatus === 'object' ? event.eventStatus?.eventStatusId : event.eventStatus;
  if (statusId === EVENT_STATUS.COMPLETED) return "Completed";
  if (statusId === EVENT_STATUS.ONGOING) return "In Progress";
  if (statusId === EVENT_STATUS.UPCOMING) return "Registration Open";

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



function formatPrizeMoney(summary: TotalPrizeSummary | import("@/features/public/api/publicSummaryService").PublicSystemPrizeTotal | any): string {
  if (!summary) return "N/A";
  let totalPrize = 0;
  let currency = "VND";
  if (typeof summary.totalPrize === "number") {
    totalPrize = summary.totalPrize;
    currency = summary.currency || "VND";
  } else if (summary.totalPrizes && Array.isArray(summary.totalPrizes) && summary.totalPrizes.length > 0) {
    const picked = summary.totalPrizes.find((p: any) => p.prizeCurrency?.toUpperCase() === "VND") || summary.totalPrizes[0];
    totalPrize = Number(picked.totalPrize || 0);
    currency = picked.prizeCurrency || "VND";
  }
  if (!totalPrize || totalPrize === 0) return "N/A";
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

const POLICY_DOCS = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, protect, and handle your data on the SEAL Hackathon Platform.",
    updated: "Last Updated: January 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        content: "We collect personal and academic information provided during account creation and competition registration, including your full name, institutional email address (@fpt.edu.vn or student email), phone number, student ID, and team affiliation details."
      },
      {
        heading: "2. How We Use Your Information",
        content: "Your data is used exclusively to verify eligibility, manage team registrations, issue official competition updates, facilitate evaluation by assigned judges, and generate verifiable digital certificates and awards."
      },
      {
        heading: "3. Data Confidentiality & Sharing",
        content: "Your data is encrypted in transit and stored on secure cloud servers. SEAL Hackathon Platform does not sell or distribute personal data to third parties, except to authorized Event Organizers and assigned Board of Judges for official evaluation."
      },
      {
        heading: "4. User Rights & Data Deletion",
        content: "Participants reserve the right to review, update, or request the deletion of their profile data at any time by contacting our support team at contact@sealhackathon.edu.vn."
      }
    ]
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Rules, code of conduct, and legal agreements governing competition participation.",
    updated: "Last Updated: January 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        content: "By creating an account or registering for any competition on the SEAL Hackathon Platform, you agree to abide by all platform policies, event guidelines, and regulations established by FPT University."
      },
      {
        heading: "2. Intellectual Property Rights",
        content: "Participating teams retain full intellectual property rights and ownership of their submitted project source code, prototypes, and designs. Organizers reserve the right to display project summaries, team names, and event media for promotional purposes."
      },
      {
        heading: "3. Academic Integrity & Code of Conduct",
        content: "All submitted source code must be authored by registered team members within the official hackathon timeframe. Plagiarism, unauthorized code duplication, or malicious network activities will result in immediate team disqualification."
      },
      {
        heading: "4. Binding Decisions",
        content: "All evaluation scores, rankings, tier assignments, and arbitration rulings declared by the Board of Judges and Organizing Committee are final and non-negotiable."
      }
    ]
  },
  security: {
    title: "Security Policy",
    subtitle: "Our technical architecture, data encryption standards, and vulnerability disclosure process.",
    updated: "Last Updated: January 2026",
    sections: [
      {
        heading: "1. Authentication & Access Control",
        content: "The platform implements industry-standard JWT token authentication and strict Role-Based Access Control (RBAC), isolating student data, judging rubrics, and administrative controls."
      },
      {
        heading: "2. Code Submission & Artifact Security",
        content: "Project repository URLs, submitted artifacts, and judge scoring records are encrypted at rest and in transit. Access is limited strictly to assigned judges for evaluation."
      },
      {
        heading: "3. Vulnerability Disclosure",
        content: "We take security vulnerabilities seriously. If you discover a security flaw or potential exploit, please report it responsibly to contact@sealhackathon.edu.vn. We appreciate your cooperation in keeping our platform safe."
      }
    ]
  }
};

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
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryItem | null>(null);
  const [landingSettings, setLandingSettings] = useState<LandingPageSettingsData>(loadLandingSettings);
  const [activePolicyModal, setActivePolicyModal] = useState<"privacy" | "terms" | "security" | null>(null);

  useEffect(() => {
    const syncSettings = () => setLandingSettings(loadLandingSettings());
    window.addEventListener("seal_landing_settings_updated", syncSettings);
    window.addEventListener("storage", syncSettings);
    return () => {
      window.removeEventListener("seal_landing_settings_updated", syncSettings);
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  useEffect(() => {
    if (competitions.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCompetition(v => (v + 1) % competitions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [competitions.length]);

  // ─── Fetch All Landing Data via 1 Aggregate API Call ───────────────────────
  useEffect(() => {
    setCompetitionsLoading(true);
    setHofLoading(true);

    publicSummaryService.getLandingSummary()
      .then(data => {
        // 1. Set Competitions & Events Stats
        const mapped = pickLandingCompetitions(data.events).map(toCompetition);
        setCompetitions(mapped);
        setStats(prev => ({ ...prev, events: String(data.events.length) }));
        setCompetitionsError("");
        setActiveCompetition(0);

        // 2. Set Teams Stats
        setStats(prev => ({ ...prev, teams: String(data.totalTeams) }));

        // 3. Set Prize Stats
        setStats(prev => ({ ...prev, prizeMoney: formatPrizeMoney(data.totalPrize) }));

        // 4. Set Hall of Fame
        setHofGroups(groupHallOfFame(data.hallOfFame));
        setStats(prev => ({ ...prev, topProjects: String(data.hallOfFame.length) }));
      })
      .catch(error => {
        console.error("Failed to load landing summary", error);
        setCompetitionsError(error instanceof Error ? error.message : "Failed to load events.");
        setCompetitions([]);
        setStats(prev => ({
          ...prev,
          events: "N/A", teams: "N/A", prizeMoney: "N/A"
        }));
      })
      .finally(() => {
        setCompetitionsLoading(false);
        setHofLoading(false);
      });
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
          <div className="flex items-center gap-3.5">
            <img src="/logo_trans.png" alt="SEAL Logo" className="h-14 md:h-16 w-auto object-contain shrink-0 filter drop-shadow-md" />
            <div>
              <span style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em", background: ORANGE_WHITE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                SEAL
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold ml-1.5">Hackathon Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: "nav-competitions", href: "#competitions", label: "Competitions" },
              { id: "nav-hall-of-fame", href: "#hall-of-fame", label: "Hall of Fame" },
              { id: "nav-gallery", href: "#gallery", label: "Gallery" },
              { id: "nav-stats", href: "#stats", label: "Stats" },
            ].map(item => (
              <a key={item.id} href={item.href}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-orange-600 hover:bg-orange-500/10 hover:shadow-[0_8px_20px_rgba(244,121,32,0.14)]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onGoToLogin}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-orange-600 hover:bg-orange-500/10 hover:shadow-[0_8px_20px_rgba(244,121,32,0.14)]">
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
                        <p className="text-muted-foreground text-sm line-clamp-2 max-w-2xl mt-1">
                          {c.description && c.description.length > 130
                            ? `${c.description.slice(0, 130)}...`
                            : c.description}
                        </p>
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
                        const initials = entry.teamName.split(" ").map((w: any) => w[0]).join("").slice(0, 2).toUpperCase();
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

      {/* ─── Gallery ────────────────────────────────────────────── */}
      <section id="gallery" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-orange-400/30 mb-4">
              <Camera size={14} style={{ color: "#F47920" }} />
              <span className="text-sm" style={{ color: "#F47920", fontWeight: 500 }}>Event Moments</span>
            </div>
            <h2 className="mb-3">
              Competition{" "}
              <span style={{ background: "linear-gradient(135deg, #F47920 0%, #FF8C2A 50%, #FFD0A0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Gallery
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Memorable moments, intense coding sessions, and victorious celebrations captured at SEAL Hackathons.
            </p>
          </motion.div>

          {/* 6-Image Balanced Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[198px]">
            {landingSettings.gallery.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onClick={() => setSelectedGalleryImage(img)}
                className={`relative group rounded-3xl overflow-hidden glass border border-white/20 cursor-pointer ${img.spanClass}`}
              >
                {/* Background Image */}
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Featured Badge if 1st image */}
                {img.isFeatured && (
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-orange-500/90 backdrop-blur-md shadow-md">
                    <Sparkles size={12} />
                    Featured Highlight
                  </div>
                )}

                {/* Maximize Icon on Hover */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                  <Maximize2 size={16} />
                </div>

                {/* Caption Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-orange-200 mb-1.5">
                    {img.category}
                  </span>
                  <h3 className={`font-bold tracking-tight text-white mb-1 ${img.isFeatured ? "text-xl md:text-2xl" : "text-base md:text-lg"}`}>
                    {img.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 group-hover:line-clamp-2 transition-all">
                    {img.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery Lightbox Modal ───────────────────────────── */}
      <AnimatePresence>
        {selectedGalleryImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGalleryImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full glass rounded-3xl overflow-hidden border border-white/30 text-foreground shadow-2xl bg-black/90"
            >
              <button
                onClick={() => setSelectedGalleryImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedGalleryImage.url}
                  alt={selectedGalleryImage.title}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>

              <div className="p-6 bg-slate-900/90 text-white">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/30 border border-orange-400/40 text-orange-300 mb-2">
                  {selectedGalleryImage.category}
                </span>
                <h3 className="text-xl font-bold mb-2">{selectedGalleryImage.title}</h3>
                <p className="text-sm text-gray-300">{selectedGalleryImage.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Stats ─────────────────────────────────────────────── */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: "stats-competitions", icon: Trophy, value: stats.events, label: "Competitions", color: "#F47920" },
              { id: "stats-teams", icon: Users, value: stats.teams, label: "Teams", color: "#FF8C2A" },
              { id: "stats-projects", icon: Star, value: stats.topProjects, label: "Projects", color: "#7C3AED" },
              { id: "stats-prize", icon: Award, value: stats.prizeMoney, label: "Prize Money", color: "#0EA5E9" },
            ].map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center border border-white/25 hover:scale-105 transition-transform">
                <s.icon size={28} className="mx-auto mb-3" style={{ color: s.color }} />
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }} className="mt-0.5">{s.label}</div>
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
      <footer className="relative pt-20 pb-12 px-6 bg-white/85 dark:bg-slate-950/90 backdrop-blur-2xl text-slate-800 dark:text-slate-200 border-t border-white/60 dark:border-white/10 shadow-[0_-12px_48px_rgba(244,121,32,0.08)] overflow-hidden transition-colors">
        {/* Ambient Glass Glow Orbs */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-16 border-b border-slate-200/80 dark:border-white/10">

            {/* Col 1: Brand & Tagline (Spans 5 cols) */}
            <div className="space-y-5 md:col-span-5 pr-0 md:pr-4">
              <div className="flex items-center gap-4">
                <img src="/logo_trans.png" alt="SEAL Logo" className="h-16 md:h-20 w-auto object-contain shrink-0 filter drop-shadow-md" />
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", background: ORANGE_WHITE, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    SEAL
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold ml-1.5">Hackathon Platform</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-sm">
                {landingSettings.footer.tagline}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40 hover:bg-orange-500/10 flex items-center justify-center transition-all shadow-sm">
                  <Globe size={17} />
                </a>
                <a href={`mailto:${landingSettings.footer.email}`} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/40 hover:bg-orange-500/10 flex items-center justify-center transition-all shadow-sm">
                  <Mail size={17} />
                </a>
              </div>
            </div>

            {/* Col 2: Navigation (Spans 3 cols) */}
            <div className="md:col-span-3">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-5 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shadow-sm" />
                Navigation
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <li><a href="#competitions" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block hover:translate-x-1 duration-200">Tech Arena</a></li>
                <li><a href="#hall-of-fame" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block hover:translate-x-1 duration-200">Hall of Fame</a></li>
                <li><a href="#gallery" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block hover:translate-x-1 duration-200">Event Gallery</a></li>
                <li><a href="#stats" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-block hover:translate-x-1 duration-200">Platform Statistics</a></li>
              </ul>
            </div>

            {/* Col 3: Contact Info (Spans 4 cols) */}
            <div className="space-y-4 md:col-span-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-5 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shadow-sm" />
                Contact Us
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0 flex items-center justify-center shadow-sm">
                  <MapPin size={15} />
                </div>
                <span className="font-medium leading-normal">{landingSettings.footer.address}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0 flex items-center justify-center shadow-sm">
                  <Mail size={15} />
                </div>
                <span className="font-medium leading-normal">{landingSettings.footer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0 flex items-center justify-center shadow-sm">
                  <Phone size={15} />
                </div>
                <span className="font-medium leading-normal">{landingSettings.footer.phone}</span>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <p>{landingSettings.footer.copyright}</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setActivePolicyModal("privacy")} className="hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors">Privacy Policy</button>
              <button onClick={() => setActivePolicyModal("terms")} className="hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors">Terms of Service</button>
              <button onClick={() => setActivePolicyModal("security")} className="hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer transition-colors">Security Policy</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Policy Detail Modal ────────────────────────────── */}
      <AnimatePresence>
        {activePolicyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePolicyModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 text-foreground shadow-[0_20px_60px_rgba(244,121,32,0.12)] bg-white/90 dark:bg-slate-950/95 backdrop-blur-2xl transition-colors"
            >
              {/* Ambient Glass Glow Orbs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-3.5">
                  <img src="/logo_trans.png" alt="SEAL Logo" className="h-14 w-auto object-contain shrink-0 filter drop-shadow-md" />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {POLICY_DOCS[activePolicyModal].title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {POLICY_DOCS[activePolicyModal].updated}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePolicyModal(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
                <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold bg-orange-500/10 p-3.5 rounded-2xl border border-orange-500/20 shadow-sm">
                  {POLICY_DOCS[activePolicyModal].subtitle}
                </p>

                {POLICY_DOCS[activePolicyModal].sections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {sec.heading}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between text-xs text-slate-500 font-medium relative z-10">
                <span>SEAL Hackathon Platform — FPT University</span>
                <button
                  onClick={() => setActivePolicyModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all shadow-md active:scale-95"
                >
                  Close & Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
