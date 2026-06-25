import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/store/authStore";
import { roundService, type RoundResponse, type RoundCriterionResponse } from "@/features/judging/api/roundService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";

import { JudgeRoundsView } from "./components/JudgeRoundsView";
import { JudgeSubmissionsView } from "./components/JudgeSubmissionsView";
import { JudgeScoringView } from "./components/JudgeScoringView";
import { JudgeCalibrationView } from "./components/JudgeCalibrationView";
import { JudgeHistoryView } from "./components/JudgeHistoryView";
import { JudgeProfileView } from "./components/JudgeProfileView";

export function JudgeDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();

  // ── Assigned rounds from API ───────────────────────────────────────────────
  const [apiRounds, setApiRounds] = useState<RoundResponse[]>([]);
  const [apiCriteria, setApiCriteria] = useState<RoundCriterionResponse[]>([]);
  const [apiSubmissions, setApiSubmissions] = useState<SubmissionResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const loadRoundData = (roundId: string) => {
    setSelectedRoundId(roundId);
    setApiCriteria([]);
    setApiSubmissions([]);
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

  const handleNavigate = (page: string) => {
    onNavigate(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "rounds":
        return (
          <JudgeRoundsView
            apiRounds={apiRounds}
            onSelectRound={loadRoundData}
            onNavigate={handleNavigate}
          />
        );
      case "submissions":
        return (
          <JudgeSubmissionsView
            apiSubmissions={apiSubmissions}
            apiRounds={apiRounds}
            onSelectSubmission={setSelectedSubmission}
            onNavigate={handleNavigate}
          />
        );
      case "scoring":
        return (
          <JudgeScoringView
            apiCriteria={apiCriteria}
            apiRounds={apiRounds}
            selectedRoundId={selectedRoundId}
            selectedSubmission={selectedSubmission}
          />
        );
      case "calibration":
        return <JudgeCalibrationView />;
      case "history":
        return <JudgeHistoryView />;
      case "profile":
        return <JudgeProfileView />;
      default:
        return (
          <JudgeRoundsView
            apiRounds={apiRounds}
            onSelectRound={loadRoundData}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
