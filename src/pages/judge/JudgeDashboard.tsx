import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/store/authStore";
import { roundService, type RoundResponse, type RoundCriterionResponse } from "@/features/judging/api/roundService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";

import { JudgeRoundsView } from "./components/JudgeRoundsView";
import { JudgeScoringView } from "./components/JudgeScoringView";
import { JudgeCalibrationView } from "./components/JudgeCalibrationView";
import { JudgeHistoryView } from "./components/JudgeHistoryView";
import { JudgeProfileView } from "./components/JudgeProfileView";
import { JudgeSubmissionsStep } from "./components/JudgeSubmissionsStep";
import { JudgeOverviewView } from "./components/JudgeOverviewView";

export function JudgeDashboard({ currentPage, onNavigate, navKey = 0 }: { currentPage: string; onNavigate: (page: string, options?: { state?: any }) => void; navKey?: number }) {
  const { user } = useAuth();

  // ── Assigned rounds from API ───────────────────────────────────────────────
  const [apiRounds, setApiRounds] = useState<RoundResponse[]>([]);
  const [apiCriteria, setApiCriteria] = useState<RoundCriterionResponse[]>([]);
  const [apiSubmissions, setApiSubmissions] = useState<SubmissionResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isFetchingRounds, setIsFetchingRounds] = useState(true);
  const [sourcePage, setSourcePage] = useState<"rounds" | "history">("rounds");

  useEffect(() => {
    if (currentPage === "rounds" || currentPage === "history") {
      setSourcePage(currentPage);
    }
  }, [currentPage]);

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
    if (!user?.userId) return;
    setIsFetchingRounds(true);
    roundService.getRoundsByJudge(user.userId)
      .then(rounds => {
        setApiRounds(rounds);
        const active = rounds.find(r => r.roundStatusId) ?? rounds[0];
        if (active) loadRoundData(active.roundId);
      })
      .catch(() => {})
      .finally(() => setIsFetchingRounds(false));
  }, [user?.userId]);

  const handleNavigate = (page: string, options?: { state?: any }) => {
    onNavigate(page, options);
  };

  const renderPage = () => {
    return (
      <>
        {/* Judge Dashboard Overview */}
        {(currentPage === "dashboard" || (!["dashboard", "rounds", "submissions", "scoring", "calibration", "history", "profile"].includes(currentPage))) && (
          <JudgeOverviewView
            apiRounds={apiRounds}
            apiSubmissions={apiSubmissions}
            onNavigate={handleNavigate}
            onSelectRound={loadRoundData}
            isLoadingRounds={isFetchingRounds}
          />
        )}

        {/* Mount JudgeRoundsView ONLY if we are on 'rounds', or if we went to 'scoring' / 'submissions' from 'rounds' */}
        {(currentPage === "rounds" || currentPage === "submissions" || (currentPage === "scoring" && sourcePage === "rounds")) && (
          <div style={{ display: currentPage === "rounds" ? "block" : "none" }}>
            <JudgeRoundsView
              apiRounds={apiRounds}
              apiSubmissions={apiSubmissions}
              apiCriteria={apiCriteria}
              onSelectRound={loadRoundData}
              onSelectSubmission={setSelectedSubmission}
              onNavigate={handleNavigate}
              isLoadingRounds={isFetchingRounds}
              selectedRoundId={selectedRoundId}
              resetKey={navKey}
            />
          </div>
        )}

        {/* Mount JudgeHistoryView if we are on 'history', or if we went to 'scoring' from 'history' */}
        {(currentPage === "history" || (currentPage === "scoring" && sourcePage === "history")) && (
          <div style={{ display: currentPage === "history" ? "block" : "none" }}>
            <JudgeHistoryView 
              apiRounds={apiRounds}
              selectedRoundId={selectedRoundId}
              onSelectRound={loadRoundData}
              apiSubmissions={apiSubmissions}
              apiCriteria={apiCriteria}
              onSelectSubmission={setSelectedSubmission}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {currentPage === "submissions" && (
          <JudgeSubmissionsStep 
            apiSubmissions={apiSubmissions}
            apiRounds={apiRounds}
            apiCriteria={apiCriteria}
            onSelectSubmission={setSelectedSubmission}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate("rounds")}
          />
        )}

        {currentPage === "scoring" && (
          <JudgeScoringView
            apiCriteria={apiCriteria}
            apiRounds={apiRounds}
            selectedRoundId={selectedRoundId}
            selectedSubmission={selectedSubmission}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === "calibration" && (
          <JudgeCalibrationView 
            apiRounds={apiRounds}
            selectedRoundId={selectedRoundId || apiRounds[0]?.roundId} 
            onSelectRound={loadRoundData}
          />
        )}

        {currentPage === "profile" && <JudgeProfileView />}
      </>
    );
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
