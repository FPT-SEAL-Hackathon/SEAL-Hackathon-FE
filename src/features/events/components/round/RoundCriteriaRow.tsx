import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import {
  Button,
  COLORS,
} from "../../../../components/shared/UIComponents";

import { RoundCriteria } from "../../types/round";
import { UpdateRoundCriterionRequest } from "../../types/round";

interface Props {
  criterion: RoundCriteria;
  onUpdate: (
    roundCriterionId: string,
    body: UpdateRoundCriterionRequest
  ) => Promise<void> | void;

  onDelete: (criterion: RoundCriteria) => void;
}

export function RoundCriterionRow({
  criterion,
  onUpdate,
  onDelete,
}: Props) {
  const [weight, setWeight] = useState(String(criterion.weight));
  const [maxScore, setMaxScore] = useState(String(criterion.maxScore));

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWeight(String(criterion.weight));
    setMaxScore(String(criterion.maxScore));
  }, [criterion]);

  const dirty = useMemo(() => {
    return (
      weight !== String(criterion.weight) ||
      maxScore !== String(criterion.maxScore)
    );
  }, [weight, maxScore, criterion]);

  const handleCancel = () => {
    setWeight(String(criterion.weight));
    setMaxScore(String(criterion.maxScore));
  };

  const handleSave = async (
    input?: HTMLInputElement
  ) => {
    const parsedWeight = Number(weight);
    const parsedMaxScore = Number(maxScore);

    if (
      weight.trim() === "" ||
      maxScore.trim() === "" ||
      Number.isNaN(parsedWeight) ||
      Number.isNaN(parsedMaxScore)
    ) {
      handleCancel();
      input?.blur();
      return;
    }

    if (parsedWeight < 0 || parsedMaxScore < 0) {
      return;
    }

    setSaving(true);

    try {
      await onUpdate(
        criterion.roundCriterionId,
        {
          weight: parsedWeight,
          maxScore: parsedMaxScore,
        }
      );

      input?.blur();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      await handleSave(
        e.currentTarget
      );
    }

    if (e.key === "Escape") {
      handleCancel();
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "var(--surface-bg)",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Left */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.textPrimary,
            }}
          >
            {criterion.criterionName}
          </span>

          {dirty && (
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                fontSize: 10,
                fontWeight: 600,
                background: "#FEF3C7",
                color: "#92400E",
              }}
            >
              Unsaved
            </span>
          )}
        </div>

        {criterion.description && (
          <div
            style={{
              fontSize: 11,
              color: COLORS.textSecondary,
              marginTop: 2,
            }}
          >
            {criterion.description}
          </div>
        )}
      </div>

      {/* Weight */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal
          size={12}
          style={{ color: COLORS.textSecondary }}
        />

        <span
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
          }}
        >
          Weight
        </span>

        <input
          type="text"
          inputMode="numeric"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-lg px-2 py-1 outline-none"
          style={{
            width: 64,
            fontSize: 12,
            textAlign: "center",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            color: COLORS.textPrimary,
          }}
        />
      </div>

      {/* Max Score */}
      <div className="flex items-center gap-1.5">
        <Award
          size={12}
          style={{ color: COLORS.textSecondary }}
        />

        <span
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
          }}
        >
          Max
        </span>

        <input
          type="text"
          inputMode="numeric"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-lg px-2 py-1 outline-none"
          style={{
            width: 64,
            fontSize: 12,
            textAlign: "center",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
            color: COLORS.textPrimary,
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {dirty && (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={12} />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              Save
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={<X size={12} />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        )}

        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={12} />}
          onClick={() => onDelete(criterion)}
        />
      </div>
    </div>
  );
}