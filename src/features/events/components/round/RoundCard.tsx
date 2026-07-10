import { useState } from "react";
import { Edit, Trash2, X, ChevronDown, ChevronRight, GitBranch, UserCheck } from "lucide-react";
import { Card, Button, StatusBadge, COLORS } from "../../../../components/shared/UIComponents";
import { CriteriaImportPanel } from "../../shared/ui/shared";
import { RoundForm } from "./RoundForm";
import { Round } from "../../types/round";
import { getRoundStatus } from "../../utils/roundUtils";
import { useRoundContext } from "../../context/RoundContext";
import { AssignJudgesModal } from "./AssignJudgesModal";

interface Props {
    round: Round;
}
export function RoundCard({
  round,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const roundStatus = getRoundStatus(round.roundStatusId);

  const {
    eventCriteria,

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

  const judges = roundJudges[round.roundId] ?? [];
  const importedCriteria = roundCriteria[round.roundId] ?? [];

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
            <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" icon={<UserCheck size={12} />} onClick={() => setShowJudgeModal(true)}>Judges</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => deleteRound(round.categoryId, round.roundId)}>Delete</Button>
          </div>
          {expanded
            ? <ChevronDown size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
            : <ChevronRight size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />}
        </div>

        {expanded && (
          <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {round.description && (
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
                onRemoveRoundCriteria={
                  (roundCriterionId) => 
                    removeRoundCriterion(
                      round.roundId,
                      roundCriterionId
                    )
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
                <div className="flex flex-wrap gap-2">
                  {judges.map(j => (
                    <div
                      key={j.judgeId}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: `${COLORS.warning}10`, border: `1px solid ${COLORS.warning}25` }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>{j.fullName}</span>
                      <button onClick={() => disableJudge(round.roundId, j.roundJudgeId)} style={{ color: COLORS.warning }}>
                        <X size={11} />
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