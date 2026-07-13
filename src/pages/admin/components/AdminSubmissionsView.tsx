import {
  AlertTriangle, BookOpen, CheckCircle, Eye, FileText, Filter,
  Github, Loader, Shield, Star, Upload, X
} from "lucide-react";
import {
  Card, SectionHeader, COLORS, StatusBadge, Button, StatCard
} from "@/components/shared/UIComponents";

interface AdminViewProps {
  context: any;
}

export function AdminSubmissionsView({ context }: AdminViewProps) {
  const {
    apiEvents,
    selectedEventId,
    setSelectedEventId,
    apiCategories,
    apiRounds,
    selectedSubmissionCategoryId,
    setSelectedSubmissionCategoryId,
    selectedSubmissionRoundId,
    setSelectedSubmissionRoundId,
    adminSubmissions,
    submissionScope,
    setSubmissionScope,
    submissionsLoading,
    submissionsError,
    setSubmissionReloadKey,
    submissionActionMessage,
    submissionDisqualifyTarget,
    setSubmissionDisqualifyTarget,
    submissionDisqualifyReason,
    setSubmissionDisqualifyReason,
    submissionDisqualifying,
    handleSubmissionDisqualifyConfirm,
  } = context;

  const submitted = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("submitted")
  ).length;
  const disqualified = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("disqualified")
  ).length;
  const scored = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("scored")
  ).length;
  const selectedRound = apiRounds.find((round: any) => round.roundId === selectedSubmissionRoundId);
  const getSubmissionRound = (submission: any) =>
    apiRounds.find((round: any) => round.roundId === submission.roundId);
  const getRoundName = (submission: any) =>
    submission.roundName
    ?? submission.round?.roundName
    ?? getSubmissionRound(submission)?.roundName
    ?? submission.roundId
    ?? "Unknown round";
  const getSubmissionName = (submission: any) =>
    submission.submissionName
    ?? submission.name
    ?? submission.title
    ?? submission.notes
    ?? "Untitled submission";
  const isCalibrationSubmission = (submission: any) => {
    const round = getSubmissionRound(submission);
    return Boolean(
      submission.isCalibrationRound
      ?? submission.isCalibration
      ?? submission.isSampleSubmission
      ?? submission.sampleSubmission
      ?? submission.round?.isCalibrationRound
      ?? round?.isCalibrationRound
      ?? (selectedRound?.roundId === submission.roundId ? selectedRound?.isCalibrationRound : false)
    );
  };
  const getTeamName = (submission: any) =>
    submission.teamName
    ?? submission.team?.teamName
    ?? submission.team?.name
    ?? submission.teamId
    ?? "Unknown team";

  return (
    <>
      <SectionHeader
        title="Submission Management"
        subtitle="Review team submissions by event or round, and disqualify invalid work"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Loaded Submissions" value={adminSubmissions.length} icon={<Upload size={20} />} color={COLORS.primary} />
        <StatCard title="Submitted" value={submitted} icon={<CheckCircle size={20} />} color={COLORS.success} />
        <StatCard title="Scored" value={scored} icon={<Star size={20} />} color={COLORS.warning} />
        <StatCard title="Disqualified" value={disqualified} icon={<Shield size={20} />} color={COLORS.error} />
      </div>

      <Card className="p-5 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <select
              value={selectedEventId ?? ""}
              onChange={e => setSelectedEventId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              {apiEvents.length === 0 && <option value="">No events found</option>}
              {apiEvents.map((event: any) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
            <select
              value={selectedSubmissionCategoryId}
              onChange={e => setSelectedSubmissionCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              disabled={!selectedEventId || apiCategories.length === 0}
            >
              {apiCategories.length === 0 && <option value="">No categories found</option>}
              {apiCategories.map((category: any) => (
                <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
            <select
              value={selectedSubmissionRoundId}
              onChange={e => {
                setSelectedSubmissionRoundId(e.target.value);
                if (e.target.value) setSubmissionScope("round");
              }}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              disabled={!selectedSubmissionCategoryId || apiRounds.length === 0}
            >
              {apiRounds.length === 0 && <option value="">No rounds loaded</option>}
              {apiRounds.map((round: any) => (
                <option key={round.roundId} value={round.roundId}>{round.roundName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>VIEW</label>
            <select
              value={submissionScope}
              onChange={e => setSubmissionScope(e.target.value as "event" | "round" | "unreview")}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              <option value="event">All submissions in event</option>
              <option value="round">All submissions in round</option>
              <option value="unreview">Unreviewed submissions in round</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="md"
            icon={submissionsLoading ? <Loader size={14} className="animate-spin" /> : <Filter size={14} />}
            onClick={() => setSubmissionReloadKey((key: number) => key + 1)}
            disabled={submissionsLoading}
          >
            {submissionsLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        {selectedRound && submissionScope !== "event" && (
          <div className="mt-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>
            Deadline: {selectedRound.submissionDeadline ? new Date(selectedRound.submissionDeadline).toLocaleString("en-US") : "Not set"}
          </div>
        )}
      </Card>

      {submissionsError && (
        <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
          {submissionsError}
        </div>
      )}
      {submissionActionMessage && (
        <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
          {submissionActionMessage}
        </div>
      )}

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Team Name", "Round Name", "Submission Name", "Status", "Submitted", "Artifacts", "Repo Stats", "Action"].map(header => (
                  <th key={header} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>
                    {header.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminSubmissions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center" style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                    {submissionsLoading ? "Loading submissions..." : "No submissions found for the selected scope."}
                  </td>
                </tr>
              )}
              {adminSubmissions.map((submission: any) => {
                const status = (submission.submissionStatusName || "draft").toLowerCase().replace(/\s+/g, "_");
                const isCalibration = isCalibrationSubmission(submission);
                return (
                  <tr key={submission.submissionId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td className="px-4 py-3">
                      {isCalibration ? (
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>None</span>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{getTeamName(submission)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{getRoundName(submission)}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textSecondary }}>{getSubmissionName(submission)}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString("en-US") : "Not submitted"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Repo", url: submission.repositoryUrl, icon: <Github size={12} /> },
                          { label: "Demo", url: submission.demoUrl, icon: <Eye size={12} /> },
                          { label: "Report", url: submission.reportUrl, icon: <BookOpen size={12} /> },
                          { label: "Slides", url: submission.slideUrl, icon: <FileText size={12} /> },
                        ].map(item => item.url ? (
                          <a
                            key={item.label}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ background: `${COLORS.primary}10`, color: COLORS.primary, fontSize: 11, fontWeight: 600 }}
                          >
                            {item.icon}{item.label}
                          </a>
                        ) : null)}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {submission.repoStarCount ?? 0} stars / {submission.repoForkCount ?? 0} forks
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<AlertTriangle size={13} />}
                        onClick={() => setSubmissionDisqualifyTarget(submission)}
                        disabled={status === "disqualified"}
                      >
                        Disqualify
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {submissionDisqualifyTarget && (
        <Card className="p-5 mt-6" style={{ border: `1px solid ${COLORS.error}55` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Disqualify submission</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                {submissionDisqualifyTarget.submissionId}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={() => setSubmissionDisqualifyTarget(null)}>
              Cancel
            </Button>
          </div>
          <textarea
            value={submissionDisqualifyReason}
            onChange={e => setSubmissionDisqualifyReason(e.target.value)}
            rows={3}
            placeholder="Reason required by backend"
            className="w-full px-3 py-2.5 rounded-xl outline-none resize-none mt-4"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
          <div className="mt-4">
            <Button
              variant="danger"
              size="md"
              icon={submissionDisqualifying ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
              onClick={handleSubmissionDisqualifyConfirm}
              disabled={submissionDisqualifying || !submissionDisqualifyReason.trim()}
            >
              {submissionDisqualifying ? "Disqualifying..." : "Confirm Disqualification"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
