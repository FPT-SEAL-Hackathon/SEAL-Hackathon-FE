import { useState } from "react";
import { PlusCircle, GitBranch } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { RoundForm } from "./RoundForm";
import { RoundCard } from "./RoundCard";
import { ROUND_STATUSES } from "../../constants/roundStatus";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { Round, RoundCriteria, RoundJudge } from "../../types/round";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useEventCriteriaContext } from "../../context/EventCriteriaContext";


export function RoundsTab() {

  const [showAddRound, setShowAddRound] = useState<string | null>(null); // categoryId
  const { categories } = useCategoryContext();
  const {
    roundsByCategory,
    createRound,
    deleteRound,

    removeRoundCriterion,

    disableJudge,
  } = useRoundContext();

  const { eventCriteria } = useEventCriteriaContext();


  const [deletingRound, setDeletingRound] = useState<Round | null>(null);
  const [removingJudge, setRemovingJudge] = useState<{
    round: Round;
    judge: RoundJudge;
  } | null>(null);
  const [removingRoundCriterion, setRemovingRoundCriterion] = useState<{
    round: Round;
    criterion: RoundCriteria;
  } | null>(null);

  if (categories.length === 0) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center gap-3">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 56, height: 56, background: `${COLORS.primary}12` }}
        >
          <GitBranch size={24} style={{ color: COLORS.primary }} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>No categories yet</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
          Create categories first in the Categories tab before adding rounds.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>Rounds</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
          Manage rounds per category. Each round can have its own criteria and assigned judges.
          {eventCriteria.length === 0 && (
            <span style={{ color: COLORS.warning, marginLeft: 6 }}>
              ⚠ Import event criteria first (Criteria tab) before setting up round criteria.
            </span>
          )}
        </div>
      </div>

      {categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => {
          const rounds = roundsByCategory[cat.categoryId] ?? [];
          return (

          <div key={cat.categoryId}>
            {/* Category header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-3"
              style={{ background: `${COLORS.secondary}10`, border: `1px solid ${COLORS.secondary}20` }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.secondary }}>{cat.categoryName}</span>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusCircle size={12} />}
                onClick={() => setShowAddRound(cat.categoryId)}
              >
                Add Round
              </Button>
            </div>

            {showAddRound === cat.categoryId && (
              <RoundForm
                initial={{
                    roundName: "",
                    description: "",
                    roundOrder:
                        (roundsByCategory[cat.categoryId]?.length ?? 0) + 1,
                    roundStatusId: ROUND_STATUSES[0].statusId,
                    advancementTopN: undefined,
                    startDate: "",
                    endDate: "",
                    submissionDeadline: "",
                    judgingDeadline: "",
                    isCalibrationRound: false,
                }}
                onSave={async data => {
                    await createRound(
                        cat.categoryId,
                        data
                    );
                    setShowAddRound(null);
                }}
                onCancel={() => setShowAddRound(null)}
              />
            )}
            
            {rounds.length === 0 && showAddRound !== cat.categoryId? (
              <div
                className="py-5 text-center rounded-xl mb-2"
                style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
              >
                No rounds yet — add the first round for this category
              </div>
            ) : (
              rounds
                .slice()
                .sort((a, b) => a.roundOrder - b.roundOrder)
                .map(round => (
                  <RoundCard
                    key={round.roundId}
                    round={round} 
                    onDeleteRound={setDeletingRound}
                    onRemoveCriterion={(round, criterion) => 
                      setRemovingRoundCriterion({
                        round, 
                        criterion
                      })
                    }
                    onRemoveJudge={(round, judge) => 
                      setRemovingJudge({round, judge})
                    }               
                  />
                ))
            )}
          </div>
          )
        })}
        {deletingRound && (
          <ConfirmDialog 
            title="Delete Round"
            message={`Delete "${deletingRound.roundName}"? This action cannot be undone.`}
            confirmText="Delete"
            confirmVariant="danger"
            onCancel={() => setDeletingRound(null)}
            onConfirm={async () => {

              await deleteRound(
                deletingRound.categoryId,
                deletingRound.roundId
              );
              setDeletingRound(null);
            }}
          />
        )}
        {removingRoundCriterion && (
          <ConfirmDialog
              title="Remove Criterion"
              message={`Remove "${removingRoundCriterion.criterion.criterionName}" from "${removingRoundCriterion.round.roundName}"?`}
              confirmText="Remove"
              confirmVariant="danger"
              onCancel={() => setRemovingRoundCriterion(null)}
              onConfirm={async () => {
                  await removeRoundCriterion(
                      removingRoundCriterion.round.roundId,
                      removingRoundCriterion.criterion.roundCriterionId
                  );

                  setRemovingRoundCriterion(null);
              }}
          />
        )}
        {removingJudge && (
          <ConfirmDialog
              title="Remove Judge"
              message={`Remove "${removingJudge.judge.fullName}" from "${removingJudge.round.roundName}"?`}
              confirmText="Remove"
              confirmVariant="danger"
              onCancel={() => setRemovingJudge(null)}
              onConfirm={async () => {
                  await disableJudge(
                      removingJudge.round.roundId,
                      removingJudge.judge.roundJudgeId
                  );

                  setRemovingJudge(null);
              }}
          />
        )}
    </div>
  );
}
