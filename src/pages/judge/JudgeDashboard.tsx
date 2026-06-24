import { useState, useEffect } from "react";
import { useBlocker } from "react-router";
import {
  Star, CheckCircle, Clock, ClipboardList, BarChart2,
  ChevronRight, ExternalLink, Github, Globe, FileText,
  User, Save, AlertCircle, Eye, TrendingUp, Award, Zap, Loader
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, ScoreSlider, DataTable
} from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { roundService, type RoundResponse, type RoundCriterionResponse } from "@/features/judging/api/roundService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { judgingService, type ScoreSubmissionDTO } from "@/features/judging/api/judgingService";

const assignedRounds = [
  { id: 1, event: "SEAL Fall 2025", round: "Round 1 — Qualifying", track: "AI Agents", status: "completed", teams: 18, scored: 18, deadline: "Nov 22, 2025" },
  { id: 2, event: "SEAL Fall 2025", round: "Round 2 — Finals", track: "AI Agents", status: "scoring", teams: 10, scored: 7, deadline: "Dec 3, 2025" },
];

const submissions = [
  { id: 1, team: "AlphaCoders", title: "AI Task Manager Pro", track: "AI Agents", github: "github.com/alphacoders/ai-task", demo: "demo.alphacoders.ai", status: "pending", round: "Round 2" },
  { id: 2, team: "CodeCraft Pro", title: "Smart Meeting Assistant", track: "AI Agents", github: "github.com/codecraft/sma", demo: "sma.codecraft.io", status: "pending", round: "Round 2" },
  { id: 3, team: "ByteBuilders", title: "Neural Code Review", track: "AI Agents", github: "github.com/bytebuilders/ncr", demo: "ncr.bytebuilders.dev", status: "pending", round: "Round 2" },
  { id: 4, team: "DevDynamo", title: "AI Task Orchestrator", track: "AI Agents", github: "github.com/devdynamo/ato", demo: "ato.devdynamo.ai", status: "completed", round: "Round 2", score: 79 },
  { id: 5, team: "InnovateFPT", title: "Predictive Analytics Bot", track: "AI Agents", github: "github.com/innovatefpt/pab", demo: "pab.innovatefpt.edu", status: "completed", round: "Round 2", score: 83 },
  { id: 6, team: "TechStorm", title: "Autonomous Code Writer", track: "AI Agents", github: "github.com/techstorm/acw", demo: "acw.techstorm.io", status: "completed", round: "Round 2", score: 77 },
  { id: 7, team: "FutureForge", title: "AI-Driven Test Generator", track: "AI Agents", github: "github.com/futureforge/atg", demo: "atg.futureforge.dev", status: "completed", round: "Round 2", score: 81 },
];

const scoringCriteria = [
  { id: "innovation", label: "Innovation & Creativity", max: 25, description: "Novelty and originality of the solution" },
  { id: "technical", label: "Technical Complexity", max: 25, description: "Quality and sophistication of implementation" },
  { id: "impact", label: "Business Impact", max: 25, description: "Real-world applicability and market potential" },
  { id: "presentation", label: "Presentation Quality", max: 25, description: "Documentation, demo, and communication" },
];

const scoreHistory = [
  { team: "DevDynamo", title: "AI Task Orchestrator", round: "Round 2", total: 79, innovation: 19, technical: 20, impact: 18, presentation: 22, date: "Nov 28, 2025" },
  { team: "InnovateFPT", title: "Predictive Analytics Bot", round: "Round 2", total: 83, innovation: 21, technical: 22, impact: 20, presentation: 20, date: "Nov 27, 2025" },
  { team: "TechStorm", title: "Autonomous Code Writer", round: "Round 2", total: 77, innovation: 18, technical: 21, impact: 17, presentation: 21, date: "Nov 26, 2025" },
  { team: "FutureForge", title: "AI-Driven Test Generator", round: "Round 2", total: 81, innovation: 20, technical: 21, impact: 19, presentation: 21, date: "Nov 25, 2025" },
  { team: "AlphaCoders", title: "AI Task Manager Pro", round: "Round 1", total: 91, innovation: 24, technical: 23, impact: 22, presentation: 22, date: "Nov 20, 2025" },
];

const calibrationData = [
  { judge: "You (Dr. Pham)", avg: 80.0, min: 77, max: 83, stdDev: 2.1 },
  { judge: "Prof. Nguyen Van A", avg: 78.5, min: 72, max: 85, stdDev: 4.3 },
  { judge: "Dr. Le Thi B", avg: 82.3, min: 78, max: 88, stdDev: 2.8 },
  { judge: "Assoc. Prof. Tran C", avg: 75.1, min: 68, max: 82, stdDev: 5.2 },
  { judge: "Dr. Hoang D", avg: 83.7, min: 79, max: 89, stdDev: 3.1 },
];

export function JudgeDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();

  // ── Assigned rounds from API ───────────────────────────────────────────────
  const [apiRounds, setApiRounds] = useState<RoundResponse[]>([]);
  const [apiCriteria, setApiCriteria] = useState<RoundCriterionResponse[]>([]);
  const [apiSubmissions, setApiSubmissions] = useState<SubmissionResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  const loadRoundData = (roundId: string) => {
    setSelectedRoundId(roundId);
    Promise.all([
      roundService.getCriteria(roundId).then(setApiCriteria),
      submissionService.getByRound(roundId).then(setApiSubmissions),
    ]).catch(() => {});
  };

  useEffect(() => {
    if (!user?.id) return;
    roundService.getRoundsByJudge(user.id)
      .then(rounds => {
        setApiRounds(rounds);
        const active = rounds.find(r => r.roundStatusId) ?? rounds[0];
        if (active) loadRoundData(active.roundId);
      })
      .catch(() => {});
  }, [user?.id]);

  const [selectedSubmission, setSelectedSubmission] = useState(submissions[0]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: user?.fullName ?? "Dr. Pham Thi Lan",
    email: user?.email ?? "ptlan@fpt.edu.vn",
    expertise: "AI/ML, Computer Vision, NLP",
    institution: user?.universityName ?? "FPT University",
  });

  // Reset scoring form when changing submissions
  useEffect(() => {
    setScores({});
    setComments({});
    setScoreSaved(false);
    setScoreError("");
  }, [selectedSubmission]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const hasUnsavedChanges = currentPage === "scoring" && !scoreSaved && (totalScore > 0 || Object.values(comments).some(c => c.trim() !== ""));

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm("The score data doesn't submit will be delete, Would you like to leave?");
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleNavigate = (page: string) => {
    // With Data Router, we don't need manual intercept here because useBlocker handles navigation away.
    // However, if onNavigate just uses react-router navigate, useBlocker will intercept it anyway.
    onNavigate(page);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "The score data doesn't submit will be delete, Would you like to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const saveScore = async () => {
    setScoreLoading(true);
    setScoreError("");
    try {
      const isCalibrationRound = apiRounds.find(r => r.roundId === selectedRoundId)?.isCalibrationRound || false;
      const scorePayload: ScoreSubmissionDTO[] = apiCriteria.map((c) => ({
        submissionId: selectedSubmission.id?.toString() ?? "",
        roundCriterionId: c.roundCriterionId,
        scoreValue: scores[c.roundCriterionId] || 0,
        comment: comments[c.roundCriterionId] || "",
        isCalibration: isCalibrationRound,
      }));
      await judgingService.recordScores(scorePayload);
      setScoreSaved(true);
      setTimeout(() => setScoreSaved(false), 2500);
    } catch (err: any) {
      setScoreError(err?.message ?? "Failed to save scores");
    } finally {
      setScoreLoading(false);
    }
  };

  const renderRounds = () => (
    <>
      <SectionHeader title="Assigned Rounds" subtitle="SEAL Fall 2025 — Your evaluation assignments" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apiRounds.length > 0 ? apiRounds.map(r => (
          <Card key={r.roundId} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{r.roundName}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{r.description || "Event Track"}</div>
              </div>
              <StatusBadge status="open" />
            </div>
            <div className="mb-4">
              <ProgressBar value={0} max={1} color={COLORS.primary} label={`Ready for scoring`} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Deadline: {r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleDateString() : "N/A"}</span>
              <Button variant="outline" size="sm" icon={<ChevronRight size={13} />} onClick={() => { loadRoundData(r.roundId); handleNavigate("submissions"); }}>
                Score Now
              </Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-2 text-center py-8" style={{ color: COLORS.textSecondary }}>No rounds assigned yet.</div>
        )}
      </div>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Your Statistics</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: 28, color: COLORS.primary },
            { label: "Completed", value: 25, color: COLORS.success },
            { label: "Pending", value: 3, color: COLORS.warning },
            { label: "Avg Score Given", value: "80.0", color: COLORS.accent },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}10` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{s.value}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const displaySubmissions = apiSubmissions.map(s => ({
    id: s.submissionId,
    team: s.teamId,
    title: s.notes || `Submission ${s.submissionId.slice(0, 8)}`,
    track: "—",
    github: s.repositoryUrl ?? "",
    demo: s.demoUrl ?? "",
    status: s.submissionStatusName?.toLowerCase() === "scored" ? "completed" : "pending",
    score: undefined,
    round: apiRounds.find(r => r.roundId === s.roundId)?.roundName || "Unknown Round",
  }));

  const renderSubmissions = () => (
    <>
      <SectionHeader
        title="Submission Queue"
        subtitle={`${displaySubmissions.filter((s: any) => s.status === "pending").length} submissions pending evaluation`}
      />
      {apiSubmissions.length === 0 && (
        <div className="px-4 py-2 rounded-xl text-sm mb-3" style={{ background: `${COLORS.bg}`, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
          No submissions found for the selected round.
        </div>
      )}
      <div className="space-y-3">
        {displaySubmissions.map((sub: any) => (
          <Card key={sub.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{sub.title}</span>
                  <StatusBadge status={sub.status} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{sub.team} • {sub.round} • {sub.track}</div>
              </div>
              <div className="flex items-center gap-2">
                {sub.score !== undefined && (
                  <span className="px-3 py-1 rounded-xl font-bold" style={{ background: `${COLORS.primary}10`, color: COLORS.primary, fontSize: 14 }}>
                    {sub.score}/100
                  </span>
                )}
                {sub.github && (
                  <a href={sub.github.startsWith("http") ? sub.github : `https://${sub.github}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" icon={<Github size={13} />}>Code</Button>
                  </a>
                )}
                {sub.demo && (
                  <a href={sub.demo.startsWith("http") ? sub.demo : `https://${sub.demo}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" icon={<Globe size={13} />}>Demo</Button>
                  </a>
                )}
                {sub.status === "pending" && (
                  <Button variant="primary" size="sm" icon={<Star size={13} />} onClick={() => { setSelectedSubmission(sub); handleNavigate("scoring"); }}>
                    Score
                  </Button>
                )}
                {sub.status === "completed" && (
                  <Button variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => { setSelectedSubmission(sub); handleNavigate("scoring"); }}>
                    Review
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderScoring = () => (
    <>
      <SectionHeader title="Score Submission" subtitle="POST /scores — submissionId + criterionId + scoreValue + comment" />
      {/* Submission selector */}
      <Card className="p-4">
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>
          EVALUATING — Submission ID: {selectedSubmission.id}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{selectedSubmission.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{selectedSubmission.team} • {selectedSubmission.round} • {selectedSubmission.track}</div>
          </div>
          <div className="flex gap-2">
            <a href={`https://${selectedSubmission.github}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" icon={<Github size={13} />}>GitHub</Button>
            </a>
            <a href={`https://${selectedSubmission.demo}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" icon={<Globe size={13} />}>Slides</Button>
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria Scoring */}
        <div className="col-span-2 space-y-4">
          {apiCriteria.map(c => (
            <Card key={c.roundCriterionId} className="p-5">
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{c.description}</div>
              <ScoreSlider
                label={c.criterionName}
                value={scores[c.roundCriterionId] || 0}
                max={c.maxScore}
                onChange={v => setScores(p => ({ ...p, [c.roundCriterionId]: v }))}
              />
              <div className="mt-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Comment for {c.criterionName}</label>
                <textarea
                  value={comments[c.roundCriterionId] || ""}
                  onChange={e => setComments(p => ({ ...p, [c.roundCriterionId]: e.target.value }))}
                  rows={2}
                  placeholder="Provide feedback specifically for this criterion..."
                  className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Score Summary */}
        <div className="space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Score Summary</div>
            {apiCriteria.map(c => (
              <div key={c.roundCriterionId} className="flex justify-between mb-3">
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{c.criterionName}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{scores[c.roundCriterionId] || 0}/{c.maxScore}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 12 }}>
              {(() => {
                const maxTotal = apiCriteria.reduce((sum, c) => sum + c.maxScore, 0) || 100;
                const scoreRatio = maxTotal > 0 ? totalScore / maxTotal : 0;
                const scoreColor = scoreRatio >= 0.9 ? COLORS.success : scoreRatio >= 0.75 ? COLORS.primary : scoreRatio >= 0.5 ? COLORS.warning : COLORS.error;
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Total Score</span>
                      <span style={{ fontWeight: 700, fontSize: 24, color: scoreColor }}>
                        {totalScore}/{maxTotal}
                      </span>
                    </div>
                    <ProgressBar value={totalScore} max={maxTotal} color={scoreColor} />
                  </>
                );
              })()}
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>REQUEST PAYLOAD (POST /scores)</div>
              <pre style={{ fontSize: 11, color: COLORS.textSecondary, overflow: "auto", maxHeight: 100 }}>
{JSON.stringify(apiCriteria.map(c => ({
  submissionId: selectedSubmission.id,
  roundCriterionId: c.roundCriterionId,
  scoreValue: scores[c.roundCriterionId] || 0,
  comment: comments[c.roundCriterionId] || "",
  isCalibration: apiRounds.find(r => r.roundId === selectedRoundId)?.isCalibrationRound || false,
})), null, 2)}
              </pre>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={scoreLoading ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
              className="mt-4"
              onClick={saveScore}
              disabled={totalScore === 0 || scoreLoading}
            >
              {scoreLoading ? "Submitting..." : "Submit Score"}
            </Button>
            {scoreSaved && (
              <div className="mt-3 text-center" style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Score submitted successfully!</div>
            )}
            {scoreError && (
              <div className="mt-3 text-center" style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{scoreError}</div>
            )}
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 8 }}>Scoring Guidelines</div>
            <div className="space-y-2">
              {(() => {
                const maxTotal = apiCriteria.reduce((sum, c) => sum + c.maxScore, 0) || 100;
                return [
                  { range: `${Math.ceil(maxTotal * 0.9)}–${maxTotal}`, label: "Exceptional", color: COLORS.success },
                  { range: `${Math.ceil(maxTotal * 0.75)}–${Math.max(0, Math.ceil(maxTotal * 0.9) - 1)}`, label: "Good", color: COLORS.primary },
                  { range: `${Math.ceil(maxTotal * 0.5)}–${Math.max(0, Math.ceil(maxTotal * 0.75) - 1)}`, label: "Average", color: COLORS.warning },
                  { range: `0–${Math.max(0, Math.ceil(maxTotal * 0.5) - 1)}`, label: "Needs Improvement", color: COLORS.error },
                ].map(g => (
                  <div key={g.range} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{g.range} ({g.range.split('–')[0] && maxTotal ? Math.round(parseInt(g.range.split('–')[0])/maxTotal*100) : 0}%)</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.label}</span>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  const renderCalibration = () => (
    <>
      <SectionHeader title="Calibration Analytics" subtitle="Compare your scoring patterns with other judges" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Your Avg Score" value="80.0" icon={<Star size={20} />} color={COLORS.primary} />
        <StatCard title="Panel Avg" value="79.9" icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title="Your Std Dev" value="2.1" icon={<TrendingUp size={20} />} color={COLORS.success} />
        <StatCard title="Calibration Score" value="94%" icon={<Award size={20} />} color={COLORS.accent} />
      </div>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Judge Panel Comparison</div>
        <div className="space-y-4">
          {calibrationData.map((j, i) => (
            <div key={j.judge} className="p-4 rounded-xl" style={{ background: i === 0 ? `${COLORS.primary}08` : COLORS.bg, border: `1px solid ${i === 0 ? COLORS.primary + "30" : COLORS.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: 14, color: i === 0 ? COLORS.primary : COLORS.textPrimary }}>
                  {j.judge} {i === 0 && <span style={{ fontSize: 11, marginLeft: 4, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20` }}>You</span>}
                </span>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Range: {j.min}–{j.max}</span>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Std Dev: {j.stdDev}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Avg: {j.avg}</span>
                </div>
              </div>
              <ProgressBar value={j.avg} max={100} color={i === 0 ? COLORS.primary : COLORS.secondary} />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Calibration Insights</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Consistent Scoring", desc: "Your standard deviation of 2.1 is the lowest in the panel, indicating very consistent evaluation.", color: COLORS.success, icon: "✓" },
            { title: "Near Panel Average", desc: "Your average of 80.0 is close to the panel average of 79.9 — well calibrated.", color: COLORS.primary, icon: "≈" },
            { title: "No Outliers Detected", desc: "No extreme scores detected. Your evaluations are within acceptable variance range.", color: COLORS.success, icon: "✓" },
          ].map(insight => (
            <div key={insight.title} className="p-4 rounded-xl" style={{ background: `${insight.color}10`, border: `1px solid ${insight.color}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 18, color: insight.color }}>{insight.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{insight.title}</span>
              </div>
              <p style={{ fontSize: 12, color: COLORS.textSecondary }}>{insight.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  const renderHistory = () => (
    <>
      <SectionHeader title="Score History" subtitle="All evaluations you have completed" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Team", "Title", "Round", "Innovation", "Technical", "Impact", "Presentation", "Total", "Date"].map(h => (
                  <th key={h} className="text-left px-3 py-3" style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoreHistory.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < scoreHistory.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <td className="px-3 py-3" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{row.team}</td>
                  <td className="px-3 py-3" style={{ fontSize: 12, color: COLORS.textSecondary, maxWidth: 140 }}>{row.title}</td>
                  <td className="px-3 py-3"><StatusBadge status="completed" /></td>
                  {[row.innovation, row.technical, row.impact, row.presentation].map((v, j) => (
                    <td key={j} className="px-3 py-3" style={{ fontSize: 13, color: COLORS.textSecondary }}>{v}</td>
                  ))}
                  <td className="px-3 py-3">
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.total >= 80 ? COLORS.success : row.total >= 70 ? COLORS.warning : COLORS.error }}>{row.total}</span>
                  </td>
                  <td className="px-3 py-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title="Judge Profile" subtitle="Manage your profile and evaluation preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 text-center col-span-1">
          <div
            className="mx-auto flex items-center justify-center rounded-full text-white mb-4"
            style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})`, fontSize: 22, fontWeight: 700 }}
          >
            PL
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>{profileForm.name}</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Judge • SEAL Fall 2025</div>
          <div className="mt-4 space-y-2 text-left">
            {[
              { label: "Expertise", value: profileForm.expertise },
              { label: "Institution", value: profileForm.institution },
              { label: "Email", value: profileForm.email },
              { label: "Evaluations", value: "25 completed" },
            ].map(item => (
              <div key={item.label} className="flex flex-col">
                <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{item.label.toUpperCase()}</span>
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Profile Settings</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Expertise Areas", key: "expertise" },
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
            <Button variant="primary" size="md" icon={<Save size={14} />} className="mt-4">Save Profile</Button>
          </Card>
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Evaluation Preferences</div>
            <div className="space-y-3">
              {[
                { label: "Show scoring guidelines during evaluation", enabled: true },
                { label: "Require comment for scores below 15/25", enabled: true },
                { label: "Email notification when new submission assigned", enabled: false },
                { label: "Show other judges' scores after submitting", enabled: false },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
                  <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{pref.label}</span>
                  <div
                    className="rounded-full flex items-center transition-all"
                    style={{ width: 40, height: 22, background: pref.enabled ? COLORS.primary : COLORS.border, padding: "2px", cursor: "pointer" }}
                  >
                    <div className="rounded-full bg-white" style={{ width: 18, height: 18, transform: pref.enabled ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "rounds": return renderRounds();
      case "submissions": return renderSubmissions();
      case "scoring": return renderScoring();
      case "calibration": return renderCalibration();
      case "history": return renderHistory();
      case "profile": return renderProfile();
      default: return renderRounds();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
