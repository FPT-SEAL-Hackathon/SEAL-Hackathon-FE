import { useState } from "react";
import {
  PlusCircle, Edit, Trash2, Save, X,
  ChevronDown, ChevronRight, GitBranch, UserCheck, CheckCircle,
} from "lucide-react";
import { Card, Button, StatusBadge, COLORS } from "../../../../components/shared/UIComponents";
import { Field, Input, Textarea, Select, AssignModal, CriteriaImportPanel } from "../../shared/ui/shared";
//import { allJudges, emptyRound, roundStatuses } from "./types";
//import type { Category, Round, EventCriteria, Judge, RoundCriteria } from "./types";
import type { Category } from "../../types/category";
import { EventCriteria } from "../../types/eventCriteria";
import { AssignJudgesRequest, ImportEventCriteriaRequest, Judge, Round, RoundCriteria, RoundJudge, RoundRequest, UpdateRoundCriterionRequest } from "../../types/round";
import { RoundForm } from "./RoundForm";
import { RoundCard } from "./RoundCard";
import { ROUND_STATUSES } from "../../constants/roundStatus";

interface Props {
  categories: Category[];
  eventCriteria: EventCriteria[];
  roundsByCategory: Record<string, Round[]>;

  roundCriteria: Record<string, RoundCriteria[]>;

  roundJudges: Record<string, RoundJudge[]>;
  availableJudges: Judge[];

  onCreateRound: (
    categoryId: string,
    body: RoundRequest
  ) => Promise<void>;

  onUpdateRound: (
    categoryId: string,
    roundId: string,
    body: RoundRequest
  ) => Promise<void>;
  onDeleteRound: (
    categoryId: string,
    roundId: string
  ) => Promise<void>;

  onAssignJudge: (
    roundId: string,
    body: AssignJudgesRequest
  ) => Promise<void>;
  onRemoveJudge: (
    roundId: string,
    roundJudgeId: string
  ) => Promise<void>;

  onImportEventCriteria: (
    roundId: string,
    body: ImportEventCriteriaRequest
  ) => Promise<void>;
  onUpdateRoundCriterion: (
    roundId: string,
    roundCriterionId: string,
    body: UpdateRoundCriterionRequest
  ) => Promise<void>;
  onRemoveRoundCriterion: (
    roundId: string,
    roundCriterionId: string
  ) => Promise<void>;
}

export function RoundsTab({ 
  categories, 
  eventCriteria, 
  roundsByCategory,
  roundCriteria,
  roundJudges, 
  availableJudges,

  onCreateRound,
  onUpdateRound,
  onDeleteRound,

  onImportEventCriteria,
  onUpdateRoundCriterion,
  onRemoveRoundCriterion,

  onAssignJudge,
  onRemoveJudge,
}: Props) {

  const [showAddRound, setShowAddRound] = useState<string | null>(null); // categoryId

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
                    await onCreateRound(
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
                    eventCriteria={eventCriteria}
                    roundCriteria={roundCriteria[round.roundId] ?? []}
                    judges={roundJudges[round.roundId] ?? []}
                    availableJudges={availableJudges}
                    //onUpdate={(data) => onUpdateRound(cat.categoryId ,round.roundId, data)}
                    onUpdate={async (data) => 
                      await onUpdateRound(
                        cat.categoryId,
                        round.roundId,
                        data
                      )
                    }
                    onDelete={async () => 
                      await onDeleteRound(
                        cat.categoryId,
                        round.roundId
                      )
                    }

                    onImportEventCriteria={async (body) => 
                      await onImportEventCriteria(
                        round.roundId,
                        body
                      )
                    }
                    onUpdateRoundCriterion={(roundCriterionId, body) => 
                      onUpdateRoundCriterion(
                        round.roundId,
                        roundCriterionId,
                        body
                      )
                    }
                    onRemoveRoundCriterion={(roundCriterionId) => 
                      onRemoveRoundCriterion(
                        round.roundId,
                        roundCriterionId
                      )
                    }

                    onAssignJudge={(body) => 
                      onAssignJudge(
                        round.roundId,
                        body
                      )
                    }
                    onRemoveJudge={(roundJudgeId) =>
                      onRemoveJudge(
                        round.roundId,
                        roundJudgeId
                      )
                    }
                  />
                ))
            )}
          </div>
          )
        })}
    </div>
  );
}
