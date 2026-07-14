import { useState } from "react";
import { Edit, Trash2, X, ChevronDown, ChevronRight, GitBranch, UserCheck, Upload, Loader, User, Mail } from "lucide-react";
import { Card, Button, StatusBadge, COLORS } from "../../../../components/shared/UIComponents";
import { CriteriaImportPanel } from "../../shared/ui/shared";
import { RoundForm } from "./RoundForm";
import { Round, RoundCriteria, RoundJudge } from "../../types/round";
import { getRoundStatus } from "../../utils/roundUtils";
import { useRoundContext } from "../../context/RoundContext";
import { AssignJudgesModal } from "./AssignJudgesModal";
import { parseApiError } from "@/lib/api/apiClient";
import { submissionService } from "@/features/submissions/api/submissionService";
import { useEventCriteria } from "../../hooks/useEventCriteria";
import { useEventCriteriaContext } from "../../context/EventCriteriaContext";

const JUDGING_STATUS_ID = "40000000-0000-0000-0000-000000000003";
const COMPLETED_STATUS_ID = "40000000-0000-0000-0000-000000000004";

function normalizeStatus(value?: string | null) {
  return String(value ?? "").trim().replace(/[-_\s]+/g, " ").toLowerCase();
}

function isSampleRoundLocked(round: Round) {
  const statusId = String(round.roundStatusId ?? "").toLowerCase();
  const statusName = normalizeStatus(getRoundStatus(round.roundStatusId)?.statusName);
  return statusId === JUDGING_STATUS_ID
    || statusId === COMPLETED_STATUS_ID
    || statusName === "judging"
    || statusName === "complete"
    || statusName === "completed";
}

interface Props {
    round: Round;
    onDeleteRound: (round: Round) => void;
    onRemoveJudge: (
      round: Round,
      judge: RoundJudge
    ) => void;
    onRemoveCriterion: (
      round: Round,
      criterion: RoundCriteria
    ) => void;
}
export function RoundCard({
  round,
  onDeleteRound,
  onRemoveCriterion,
  onRemoveJudge
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [sampleSubmitting, setSampleSubmitting] = useState(false);
  const [sampleMessage, setSampleMessage] = useState("");
  const [sampleError, setSampleError] = useState("");
  const [sampleForm, setSampleForm] = useState({
    submissionName: "",
    repositoryUrl: "",
    demoUrl: "",
    reportUrl: "",
    slideUrl: "",
  });
  const roundStatus = getRoundStatus(round.roundStatusId);
  const sampleLocked = isSampleRoundLocked(round);

  const {

    roundCriteria, 

    roundJudges,

    availableJudges,

    updateRound,

    deleteRound,

    assignJudges,

    disableJudge,

    importEventCriteria,

    updateRoundCriterion,

    removeRoundCriterion,

    loadRoundCriteria,
    loadRoundJudges
  } = useRoundContext();

  const { eventCriteria } = useEventCriteriaContext()

  const judges = roundJudges[round.roundId] ?? [];
  const importedCriteria = roundCriteria[round.roundId] ?? [];

  const updateSampleForm = (key: keyof typeof sampleForm, value: string) => {
    setSampleForm(prev => ({ ...prev, [key]: value }));
  };

  const createSampleSubmission = async () => {
    if (sampleLocked) {
      setSampleError("Sample submissions are locked once the round is judging or completed.");
      return;
    }

    setSampleSubmitting(true);
    setSampleError("");
    setSampleMessage("");
    try {
      await submissionService.submitSample({
        roundId: round.roundId,
        repositoryUrl: sampleForm.repositoryUrl.trim(),
        demoUrl: sampleForm.demoUrl.trim(),
        reportUrl: sampleForm.reportUrl.trim(),
        slideUrl: sampleForm.slideUrl.trim(),
        notes: sampleForm.submissionName.trim(),
      });
      setSampleMessage("Calibration sample submission created.");
    } catch (error) {
      const parsed = parseApiError(error);
      const details = parsed.fieldErrors
        ? Object.entries(parsed.fieldErrors).map(([field, message]) => `${field}: ${message}`).join("; ")
        : "";
      setSampleError(details ? `${parsed.message}: ${details}` : parsed.message);
    } finally {
      setSampleSubmitting(false);
    }
  };

  if (editing) {
    return (
      <RoundForm
        initial={{
          roundName: round.roundName,
          description: round.description,
          roundOrder: round.roundOrder,

          roundStatusId: round.roundStatusId,

          startDate: round.startDate ?? "",
          endDate: round.endDate ?? "",
          submissionDeadline: round.submissionDeadline ?? "",
          judgingDeadline: round.judgingDeadline ?? "",

          advancementTopN: round.advancementTopN,
          isCalibrationRound: round.isCalibrationRound,
        }}
        onSave={async data => {
            await updateRound(
                round.categoryId,
                round.roundId,
                data
            );
            setEditing(false);
            }            
        }
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {showJudgeModal && (
        <AssignJudgesModal
          title="Assign Judges"
          allPeople={availableJudges}
          assignedIds={judges.map(j => j.judgeId)}
          onAssign={judge => 
            assignJudges(
              round.roundId,
              {
                judgeIds: [judge.judgeId]
              }
            )
          }
          onRemove={roundJudgeId => 
            disableJudge(
              round.roundId,
              roundJudgeId
            )
          }
          onClose={() => setShowJudgeModal(false)}
        />
      )}
      <Card className="mb-3 overflow-hidden">
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
          style={{ userSelect: "none" }}
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 28, height: 28, background: `${COLORS.primary}15` }}
          >
            <GitBranch size={13} style={{ color: COLORS.primary }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{round.roundName}</span>
              <StatusBadge status={roundStatus?.statusName ?? "Unknown"} />
              {round.isCalibrationRound && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: `${COLORS.warning}15`, color: COLORS.warning, border: `1px solid ${COLORS.warning}30` }}
                >
                  Calibration
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              Order #{round.roundOrder} • {importedCriteria.length} criteria • {judges.length} judges
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {round.isCalibrationRound && (
              <Button
                variant="outline"
                size="sm"
                icon={<Upload size={12} />}
                onClick={() => {
                  setExpanded(true);
                  setShowSampleForm(value => !value);
                }}
                disabled={sampleLocked}
              >
                Sample
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" icon={<UserCheck size={12} />} onClick={() => setShowJudgeModal(true)}>Judges</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => onDeleteRound(round)}>Delete</Button>
          </div>
          {expanded
            ? <ChevronDown size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
            : <ChevronRight size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />}
        </div>

        {expanded && (
          <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {round.description && !round.isCalibrationRound && (
              <div className="pt-3">
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{round.description}</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { label: "Start Date", value: round.startDate },
                { label: "End Date", value: round.endDate },
                { label: "Submission Deadline", value: round.submissionDeadline },
                { label: "Judging Deadline", value: round.judgingDeadline },
              ].map(f => (
                <div key={f.label} className="p-2.5 rounded-xl" style={{ background: "var(--surface-bg)" }}>
                  <div style={{ fontSize: 10, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
                    {f.value ? f.value.replace("T", " ").slice(0, 16) : "—"}
                  </div>
                </div>
              ))}
            </div>
            {round.advancementTopN != null && (
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Advancement: Top <strong style={{ color: COLORS.primary }}>{round.advancementTopN}</strong> teams advance
              </div>
            )}

            {round.isCalibrationRound && (
              <Card className="p-4" style={{ border: `1px solid ${COLORS.warning}30`, background: `${COLORS.warning}06` }}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Calibration Sample Submission</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                      Create the organizer sample submission for this calibration round. Allowed until the round moves to Judging or Completed.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={sampleLocked ? "locked" : "open"} />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Upload size={12} />}
                      onClick={() => setShowSampleForm(value => !value)}
                      disabled={sampleLocked}
                    >
                      {showSampleForm ? "Hide Form" : "Create Sample"}
                    </Button>
                  </div>
                </div>
                {sampleLocked && (
                  <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 12, fontWeight: 600 }}>
                    This calibration round is already judging or completed, so sample submissions can no longer be inserted.
                  </div>
                )}
                {showSampleForm && !sampleLocked && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {[
                        { label: "Submission Name", key: "submissionName" },
                        { label: "Repository URL", key: "repositoryUrl" },
                        { label: "Demo URL", key: "demoUrl" },
                        { label: "Report URL", key: "reportUrl" },
                        { label: "Slide URL", key: "slideUrl" },
                      ].map(field => (
                        <label key={field.key} className="block">
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 5 }}>
                            {field.label}
                          </span>
                          <input
                            value={sampleForm[field.key as keyof typeof sampleForm]}
                            onChange={event => updateSampleForm(field.key as keyof typeof sampleForm, event.target.value)}
                            className="w-full px-3 py-2 rounded-lg outline-none"
                            style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={sampleSubmitting ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
                        onClick={createSampleSubmission}
                        disabled={sampleSubmitting}
                      >
                        {sampleSubmitting ? "Creating..." : "Create Sample Submission"}
                      </Button>
                      {sampleMessage && <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 700 }}>{sampleMessage}</span>}
                      {sampleError && <span style={{ fontSize: 12, color: COLORS.error, fontWeight: 700 }}>{sampleError}</span>}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* Round criteria */}
            <div className="pt-2">
              <CriteriaImportPanel
                title="Round Criteria"
                sourceLabel="Event Criteria"
                availableCriteria={eventCriteria}
                roundCriteria={importedCriteria}
                onImport={(body) => 
                  importEventCriteria(
                    round.roundId,
                    body
                  )
                }
                onUpdateRoundCriteria={
                  (roundCriterionId, body) => 
                    updateRoundCriterion(
                      round.roundId,
                      roundCriterionId,
                      body
                    )
                }
                onRemoveRoundCriteria={(criterion) =>
                  onRemoveCriterion(round, criterion)
                }
              />
            </div>

            {/* Judges */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>Assigned Judges</span>
                <Button variant="outline" size="sm" icon={<UserCheck size={12} />} onClick={() => setShowJudgeModal(true)}>
                  Manage Judges
                </Button>
              </div>
              {judges.length === 0 ? (
                <div
                  className="py-4 text-center rounded-xl"
                  style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
                >
                  No judges assigned
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {judges.map(j => (
                    <div
                      key={j.judgeId}
                      className="flex items-start justify-between gap-3 min-w-[250px] max-w-[320px] px-4 py-3 rounded-xl"
                      style={{
                        background: `${COLORS.warning}08`,
                        border: `1px solid ${COLORS.warning}20`,
                      }}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <User
                            size={14}
                            style={{ color: COLORS.warning }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#b45309",
                            }}
                          >
                            {j.fullName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail
                            size={13}
                            style={{ color: COLORS.textSecondary }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: COLORS.textSecondary,
                            }}
                          >
                            {j.email}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveJudge(round, j)}
                        title="Remove judge"
                        className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50"
                      >
                        <X
                          size={14}
                          className="transition-colors duration-200 hover:text-red-600"
                          style={{ color: COLORS.textSecondary }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
