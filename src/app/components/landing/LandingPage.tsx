import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Medal, Star, Crown, Flame, Zap, Users, Calendar,
  ArrowRight, Award, Target, Clock, MapPin, Shield, Hash, Loader
} from "lucide-react";
import { api } from "../../services/apiClient";

interface Props {
  onGoToAuth: () => void;
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

const COMPETITIONS = [
  {
    id: 1,
    name: "SEAL Hackathon 2025 – AI Innovation",
    status: "ongoing",
    phase: "Final Round",
    startDate: "2025-11-01",
    endDate: "2025-12-15",
    location: "FPT University, Hà Nội",
    tracks: ["AI/ML", "Web3", "FinTech"],
    teams: 48,
    prize: "500.000.000 VNĐ",
    color: "#F47920",
    gradient: "from-orange-500/20 to-amber-400/10",
    description: "An annual hackathon for breakthrough technology solutions from FPT students.",
  },
  {
    id: 2,
    name: "SEAL Research Sprint – Data Science",
    status: "upcoming",
    phase: "Registration Open",
    startDate: "2026-01-10",
    endDate: "2026-03-20",
    location: "Online + FPT Campus",
    tracks: ["Data Science", "Computer Vision", "NLP"],
    teams: 0,
    prize: "200.000.000 VNĐ",
    color: "#7C3AED",
    gradient: "from-violet-500/20 to-purple-400/10",
    description: "A focused research sprint for applied data science and artificial intelligence.",
  },
  {
    id: 3,
    name: "SEAL Build Week – HealthTech",
    status: "upcoming",
    phase: "Opening Soon",
    startDate: "2026-02-01",
    endDate: "2026-02-07",
    location: "FPT University, TP.HCM",
    tracks: ["HealthTech", "IoT", "Mobile"],
    teams: 0,
    prize: "150.000.000 VNĐ",
    color: "#0EA5E9",
    gradient: "from-sky-500/20 to-blue-400/10",
    description: "A one-week build challenge for health technology with real social impact.",
  },
];

// Hall of Fame data is fetched from API — no static mock

const RANK_META = [
  { bg: "from-yellow-400/30 to-amber-300/20", border: "border-yellow-400/50", text: "text-yellow-600", label: "Champion" },
  { bg: "from-slate-300/30 to-gray-200/20",   border: "border-slate-400/50",  text: "text-slate-600",  label: "Runner-up" },
  { bg: "from-orange-300/30 to-amber-200/20", border: "border-orange-400/50", text: "text-orange-600", label: "Third place" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ongoing") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-600 border border-orange-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      Ongoing
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
          key={i}
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
  eventName: string;
  categoryName: string;
  podium: Array<HallOfFameResponse & { rank: number }>;
}

function groupHallOfFame(data: HallOfFameResponse[]): HofGroup[] {
  const map = new Map<string, HofGroup>();
  for (const item of data) {
    const key = `${item.eventName}||${item.categoryName}`;
    if (!map.has(key)) map.set(key, { eventName: item.eventName, categoryName: item.categoryName, podium: [] });
    map.get(key)!.podium.push({ ...item, rank: 0 });
  }
  const groups = Array.from(map.values());
  for (const g of groups) {
    g.podium.sort((a, b) => tierRank(a.awardTierName) - tierRank(b.awardTierName));
    g.podium = g.podium.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 }));
  }
  return groups;
}

export function LandingPage({ onGoToAuth }: Props) {
  const [activeCompetition, setActiveCompetition] = useState(0);
  const [activeHof, setActiveHof] = useState(0);
  const [hofGroups, setHofGroups] = useState<HofGroup[]>([]);
  const [hofLoading, setHofLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCompetition(v => (v + 1) % COMPETITIONS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Hall of Fame from real API
  useEffect(() => {
    api.get<HallOfFameResponse[]>("/api/v1/public/hall-of-fame", false)
      .then(data => setHofGroups(groupHallOfFame(data)))
      .catch(() => { /* keep empty, show fallback */ })
      .finally(() => setHofLoading(false));
  }, []);

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
              { href: "#competitions", label: "Competitions" },
              { href: "#hall-of-fame", label: "Hall of Fame" },
              { href: "#stats", label: "Stats" },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/40 transition-all">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onGoToAuth}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/40 transition-all">
              Sign in
            </button>
            <button onClick={onGoToAuth}
              className="px-4 py-2 rounded-xl text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: ORANGE_PRIMARY }}>
              Register ngay
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
              AI Innovation 2025 is now live
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Where{" "}
            <span style={{ background: "linear-gradient(135deg, #F47920 0%, #FF8C2A 50%, #FFD0A0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Talent
            </span>
            <br />Technology Shines
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto mb-10"
            style={{ fontSize: "1.15rem", lineHeight: 1.7 }}>
            FPT's flagship hackathon platform where students compete, innovate, and build
            trang sử vinh quang trong Hall of Fame SEAL.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onGoToAuth}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95 shadow-lg"
              style={{ background: ORANGE_WHITE, boxShadow: "0 8px 32px rgba(244,121,32,0.35)" }}>
              <Zap size={18} />
              Join Now
            </button>
            <button onClick={() => document.getElementById("hall-of-fame")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass border border-orange-400/25 text-foreground hover:bg-white/50 transition-all">
              <Trophy size={18} style={{ color: "#F47920" }} />
              Xem Hall of Fame
            </button>
          </motion.div>

          {/* Floating stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Trophy, value: "12",    label: "Events hosted" },
              { icon: Users,  value: "480+",  label: "Teams joined" },
              { icon: Award,  value: "5 tỷ",  label: "Prize pool" },
              { icon: Star,   value: "96",    label: "Outstanding projects" },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center">
                <s.icon size={20} className="mx-auto mb-1" style={{ color: "#F47920" }} />
                <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "#F47920" }}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Competitions ──────────────────────────────────────────── */}
      <section id="competitions" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-orange-400/30 mb-4">
              <Target size={14} style={{ color: "#F47920" }} />
              <span className="text-sm" style={{ color: "#F47920", fontWeight: 500 }}>Competitions</span>
            </div>
            <h2 className="mb-3">Technology Arena</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Những cuộc thi đang và sắp diễn ra — cơ hội để bạn chứng minh tài năng và bước vào Hall of Fame.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {COMPETITIONS.map((c, i) => (
              <button key={c.id} onClick={() => setActiveCompetition(i)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${activeCompetition === i ? "text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"}`}
                style={activeCompetition === i ? { background: c.color } : {}}>
                {c.name.split("–")[0].trim()}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeCompetition} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              {(() => {
                const c = COMPETITIONS[activeCompetition];
                return (
                  <div className="glass rounded-3xl overflow-hidden border border-white/30 max-w-4xl mx-auto">
                    <div className={`bg-gradient-to-r ${c.gradient} border-b border-white/20 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                      <div>
                        <StatusBadge status={c.status} />
                        <h3 className="mt-2 mb-1">{c.name}</h3>
                        <p className="text-muted-foreground text-sm">{c.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl" style={{ fontWeight: 800, color: c.color }}>{c.prize}</div>
                        <div className="text-xs text-muted-foreground">Prize pool</div>
                      </div>
                    </div>

                    <div className="px-8 py-6 grid sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Timeline</div>
                            <div className="text-sm font-medium">
                              {new Date(c.startDate).toLocaleDateString("vi-VN")} – {new Date(c.endDate).toLocaleDateString("vi-VN")}
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
                        {c.status === "ongoing" && (
                          <div className="flex items-center gap-3">
                            <Users size={16} style={{ color: c.color }} />
                            <div>
                              <div className="text-xs text-muted-foreground">Active teams</div>
                              <div className="text-sm font-medium">{c.teams} teams</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Hash size={16} style={{ color: c.color }} />
                          <div>
                            <div className="text-xs text-muted-foreground">Phase</div>
                            <div className="text-sm font-medium">{c.phase}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Tracks</div>
                        <div className="flex flex-wrap gap-2">
                          {c.tracks.map(t => (
                            <span key={t} className="px-3 py-1 rounded-full text-sm border"
                              style={{ borderColor: c.color + "40", color: c.color, background: c.color + "12" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <button onClick={onGoToAuth}
                          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90"
                          style={{ background: c.color }}>
                          {c.status === "ongoing" ? "View Details" : "Register to Join"}
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
            {COMPETITIONS.map((c, i) => (
              <motion.button key={c.id} onClick={() => setActiveCompetition(i)}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-2xl glass border text-left transition-all hover:scale-[1.02] ${activeCompetition === i ? "border-orange-400/40" : "border-white/20"}`}>
                <StatusBadge status={c.status} />
                <div className="mt-2 text-sm font-medium line-clamp-2">{c.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.prize}</div>
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
              Sảnh{" "}
              <span style={{ background: "linear-gradient(135deg, #FFD700, #F47920, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Danh Vọng
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Những cái tên đã viết nên lịch sử SEAL — top 3 teams excellent nhất của từng cuộc thi.
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
              <p className="text-sm">Chưa có dữ liệu Hall of Fame.</p>
            </div>
          )}

          {/* Event/category selector */}
          {!hofLoading && hofGroups.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {hofGroups.map((g, i) => (
                  <button key={i} onClick={() => setActiveHof(i)}
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
                          <motion.div key={entry.teamName}
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
                              <div className="p-3 rounded-xl bg-white/20 border border-white/30">
                                <div className="text-xs text-muted-foreground mb-0.5">Team leader</div>
                                <div className="font-semibold text-sm">{entry.leaderName}</div>
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
              { icon: Trophy, value: "12",    label: "Competitions",    sub: "completed", color: "#F47920" },
              { icon: Users,  value: "480+",  label: "Teams",     sub: "across FPT",   color: "#FF8C2A" },
              { icon: Star,   value: "96",    label: "Projects",       sub: "excellent",       color: "#7C3AED" },
              { icon: Award,  value: "5 tỷ",  label: "Prizes", sub: "awarded",  color: "#0EA5E9" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center border border-white/25 hover:scale-105 transition-transform">
                <s.icon size={28} className="mx-auto mb-3" style={{ color: s.color }} />
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }} className="mt-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
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
            Sign in để xem thông tin cuộc thi của bạn, hoặc đăng ký để tham gia vào đấu trường công nghệ SEAL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onGoToAuth}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: ORANGE_WHITE, boxShadow: "0 8px 32px rgba(244,121,32,0.35)" }}>
              <Zap size={18} />
              Sign In / Đăng Ký
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
          <p className="text-xs text-muted-foreground">© 2026 FPT University. Where technology talent shines.</p>
        </div>
      </footer>
    </div>
  );
}

