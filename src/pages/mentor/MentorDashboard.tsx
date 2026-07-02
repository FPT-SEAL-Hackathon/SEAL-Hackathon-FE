import { useState } from "react";
import {
  CheckCircle, Calendar, MessageSquare, Target, TrendingUp,
  Users, Save, PlusCircle, Edit, Clock, Star, ChevronRight,
  User, Mail, Award, Zap, BookOpen, Video, ExternalLink
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, TimelineItem
} from "@/components/shared/UIComponents";
import { MentorConsultations } from "./MentorConsultations";

const tracks = [
  {
    id: 1, name: "AI Agents", event: "SEAL Fall 2025", teams: 3, totalTeams: 10,
    description: "AI-powered autonomous agents for task automation and decision making",
    technologies: ["Python", "LangChain", "OpenAI", "FastAPI"],
  },
  {
    id: 2, name: "Web3 & Blockchain", event: "FPT Web3 Challenge", teams: 2, totalTeams: 8,
    description: "Decentralized applications and smart contract development",
    technologies: ["Solidity", "Ethereum", "React", "Hardhat"],
  },
];

const assignedTeams = [
  {
    id: 1, name: "DevDynamo", track: "AI Agents", members: 5, rank: 12, score: 79.3, progress: 72,
    lastMeeting: "Nov 25, 2025", nextMeeting: "Dec 2, 2025 at 10:00 AM", status: "active",
    notes: "Great progress on the AI orchestration layer. Need to improve the demo quality before finals. Focus on business case presentation.",
    milestones: [
      { label: "Project Kickoff", done: true, date: "Nov 15" },
      { label: "MVP Prototype", done: true, date: "Nov 20" },
      { label: "Round 1 Submission", done: true, date: "Nov 22" },
      { label: "Integration Testing", done: false, date: "Nov 28" },
      { label: "Finals Submission", done: false, date: "Dec 1" },
    ],
  },
  {
    id: 2, name: "AlphaCoders", track: "AI Agents", members: 5, rank: 1, score: 92.1, progress: 95,
    lastMeeting: "Nov 26, 2025", nextMeeting: "Nov 30, 2025 at 2:00 PM", status: "active",
    notes: "Exceptional team — top of the leaderboard. Focus on polishing presentation and edge case handling.",
    milestones: [
      { label: "Project Kickoff", done: true, date: "Nov 15" },
      { label: "MVP Prototype", done: true, date: "Nov 18" },
      { label: "Round 1 Submission", done: true, date: "Nov 22" },
      { label: "Integration Testing", done: true, date: "Nov 26" },
      { label: "Finals Submission", done: false, date: "Dec 1" },
    ],
  },
  {
    id: 3, name: "ByteBuilders", track: "AI Agents", members: 5, rank: 3, score: 87.8, progress: 85,
    lastMeeting: "Nov 24, 2025", nextMeeting: "Dec 1, 2025 at 3:30 PM", status: "active",
    notes: "Strong technical implementation. Should work on the business impact section of the presentation.",
    milestones: [
      { label: "Project Kickoff", done: true, date: "Nov 15" },
      { label: "MVP Prototype", done: true, date: "Nov 19" },
      { label: "Round 1 Submission", done: true, date: "Nov 22" },
      { label: "Integration Testing", done: true, date: "Nov 25" },
      { label: "Finals Submission", done: false, date: "Dec 1" },
    ],
  },
];

const meetings = [
  { id: 1, team: "AlphaCoders", type: "Video Call", date: "Nov 30, 2025", time: "2:00 PM", duration: "45 min", topic: "Finals prep — presentation polish", status: "scheduled" },
  { id: 2, team: "DevDynamo", type: "Video Call", date: "Dec 2, 2025", time: "10:00 AM", duration: "60 min", topic: "Technical review + business case coaching", status: "scheduled" },
  { id: 3, team: "ByteBuilders", type: "In-person", date: "Dec 1, 2025", time: "3:30 PM", duration: "45 min", topic: "Business impact section workshop", status: "scheduled" },
  { id: 4, team: "DevDynamo", type: "Video Call", date: "Nov 25, 2025", time: "10:00 AM", duration: "60 min", topic: "Round 2 strategy + demo walkthrough", status: "completed" },
  { id: 5, team: "AlphaCoders", type: "Video Call", date: "Nov 26, 2025", time: "2:00 PM", duration: "30 min", topic: "Quick check-in — round 1 feedback review", status: "completed" },
];

export function MentorDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const [selectedTeam, setSelectedTeam] = useState(assignedTeams[0]);
  const [noteText, setNoteText] = useState(assignedTeams[0].notes);
  const [noteSaved, setNoteSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "Dr. Nguyen Van Minh", email: "nvminh@fpt.edu.vn", expertise: "AI/ML, Software Engineering, Entrepreneurship", institution: "FPT University",
    bio: "Associate Professor with 10+ years of industry experience in AI and software engineering.",
  });

  const saveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const renderTracks = () => (
    <>
      <SectionHeader title="Assigned Tracks" subtitle="AI Agents Track — SEAL Fall 2025" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tracks.map(track => (
          <Card key={track.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{track.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{track.event}</div>
              </div>
              <StatusBadge status="active" />
            </div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>{track.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {track.technologies.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${COLORS.primary}10`, color: COLORS.primary }}>{t}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>My teams: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{track.teams}</span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}> / {track.totalTeams} total</span>
              </div>
              <Button variant="outline" size="sm" icon={<ChevronRight size={13} />} onClick={() => onNavigate("teams")}>
                View Teams
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Mentor Overview</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Teams Mentored", value: 3, color: COLORS.primary },
            { label: "Meetings Held", value: 7, color: COLORS.secondary },
            { label: "Avg Team Progress", value: "84%", color: COLORS.success },
            { label: "Notes Written", value: 12, color: COLORS.accent },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: `${s.color}10` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{s.value}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const renderTeams = () => (
    <>
      <SectionHeader title="Mentoring Notes" subtitle="Track team progress and leave consultation notes" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {assignedTeams.map((team: any) => (
          <button
            key={team.id}
            onClick={() => { setSelectedTeam(team); setNoteText(team.notes); }}
            className="text-left rounded-2xl p-4 transition-all"
            style={{
              background: selectedTeam.id === team.id ? `${COLORS.success}10` : COLORS.card,
              border: `1px solid ${selectedTeam.id === team.id ? COLORS.success : COLORS.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{team.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>#{team.rank}</span>
            </div>
            <ProgressBar value={team.progress} max={100} color={COLORS.success} />
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>Score: {team.score}/100 • {team.members} members</div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestones */}
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{selectedTeam.name} — Milestones</div>
            <div className="space-y-3">
              {selectedTeam.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} style={{ color: m.done ? COLORS.success : COLORS.border, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: m.done ? 500 : 600, color: m.done ? COLORS.textSecondary : COLORS.textPrimary, textDecoration: m.done ? "line-through" : "none" }}>
                      {m.label}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.date}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 }}>Consultation Notes</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>Private notes for {selectedTeam.name}</div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-xl outline-none resize-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              placeholder="Add consultation notes, observations, and recommendations..."
            />
            <div className="flex items-center gap-3 mt-3">
              <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={saveNote}>Save Notes</Button>
              {noteSaved && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Saved!</span>}
            </div>
          </Card>
        </div>
      )}
    </>
  );

  const renderProgress = () => (
    <>
      <SectionHeader title="Team Progress" subtitle="Monitor progress across all mentored teams" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Teams" value={3} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Avg Progress" value="84%" icon={<TrendingUp size={20} />} color={COLORS.success} />
        <StatCard title="Teams in Top 10" value={2} icon={<Award size={20} />} color={COLORS.warning} />
        <StatCard title="Days to Finals" value={2} icon={<Clock size={20} />} color={COLORS.error} />
      </div>
      <div className="space-y-4">
        {assignedTeams.map((team, i) => (
          <Card key={team.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{team.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Rank #{team.rank} • Score: {team.score}/100 • {team.members} members</div>
              </div>
              <StatusBadge status={team.status} />
            </div>
            <div className="mb-4">
              <ProgressBar value={team.progress} max={100} color={team.progress >= 90 ? COLORS.success : team.progress >= 70 ? COLORS.primary : COLORS.warning} label={`Overall Progress: ${team.progress}%`} />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {team.milestones.map((m, j) => (
                <div key={j} className="text-center p-2 rounded-xl" style={{ background: m.done ? `${COLORS.success}10` : `${COLORS.border}40` }}>
                  <CheckCircle size={16} style={{ color: m.done ? COLORS.success : COLORS.border, margin: "0 auto 4px" }} />
                  <div style={{ fontSize: 11, color: m.done ? COLORS.success : COLORS.textSecondary, fontWeight: m.done ? 600 : 400 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" icon={<MessageSquare size={13} />} onClick={() => { setSelectedTeam(team); setNoteText(team.notes); onNavigate("teams"); }}>
                Notes
              </Button>
              <Button variant="ghost" size="sm" icon={<Calendar size={13} />} onClick={() => onNavigate("schedule")}>
                Schedule Meeting
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderSchedule = () => (
    <>
      <SectionHeader
        title="Meeting Schedule"
        subtitle="Upcoming and past meetings with your teams"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />}>Schedule Meeting</Button>}
      />
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 }}>UPCOMING</div>
      <div className="space-y-3 mb-6">
        {meetings.filter(m => m.status === "scheduled").map(m => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 44, height: 44, background: `${COLORS.secondary}15` }}
              >
                {m.type === "Video Call" ? <Video size={18} style={{ color: COLORS.secondary }} /> : <Users size={18} style={{ color: COLORS.secondary }} />}
              </div>
              <div className="flex-1">
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{m.team} — {m.topic}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.type} • {m.date} at {m.time} • {m.duration}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<Video size={13} />}>Join</Button>
                <Button variant="ghost" size="sm" icon={<Edit size={13} />}>Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 }}>PAST MEETINGS</div>
      <div className="space-y-3">
        {meetings.filter(m => m.status === "completed").map(m => (
          <Card key={m.id} className="p-4" style={{ opacity: 0.75 }}>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 44, height: 44, background: `${COLORS.border}` }}
              >
                <CheckCircle size={18} style={{ color: COLORS.success }} />
              </div>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{m.team} — {m.topic}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.type} • {m.date} at {m.time} • {m.duration}</div>
              </div>
              <StatusBadge status="completed" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title="Mentor Profile" subtitle="Manage your profile and mentoring settings" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 text-center col-span-1">
          <div
            className="mx-auto flex items-center justify-center rounded-full text-white mb-4"
            style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.secondary})`, fontSize: 22, fontWeight: 700 }}
          >
            NM
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>{profileForm.name}</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Mentor • AI Agents Track</div>
          <div className="mt-4 space-y-2 text-left">
            {[
              { label: "Teams", value: "3 assigned" },
              { label: "Track", value: "AI Agents" },
              { label: "Institution", value: profileForm.institution },
              { label: "Email", value: profileForm.email },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
        <div className="col-span-2">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Profile Settings</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Expertise", key: "expertise" },
                { label: "Institution", key: "institution" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                  <input
                    value={profileForm[field.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <Button variant="primary" size="md" icon={<Save size={14} />} className="mt-4">Save Profile</Button>
          </Card>
        </div>
      </div>
    </>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return renderProgress();
      case "categories": return renderTracks();
      case "tracks": return renderTracks();
      case "teams": return renderTeams();
      case "progress": return renderProgress();
      case "schedule": return renderSchedule();
      case "profile": return renderProfile();
      case "consultations": return <MentorConsultations onNavigate={onNavigate} />;
      default: return renderProgress();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
