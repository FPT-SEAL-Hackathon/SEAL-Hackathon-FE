import { CheckCircle, Trash2, Upload, SlidersHorizontal, Award } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import type { EventCriteria, ImportCriteriaRequest } from "../../types/eventCriteria";
import { CriteriaTemplate } from "../../../criteriaTemplates/types/template";
import { useState } from "react";

interface Props {
  templates: CriteriaTemplate[];
  eventCriteria: EventCriteria[];
  onImport: (templateIds: ImportCriteriaRequest) => void;

  onUpdate: (
    eventCriterionId: string, 
    field: "weight" | "maxScore", 
    value: number
  ) => void;

  onRemove: (eventCriterionId: string) => void;
}

export function CriteriaTab({ 
    templates,
    eventCriteria, 
    onImport, 
    onUpdate, 
    onRemove 
}: Props) {
  const totalWeight = eventCriteria.reduce((s, c) => s + c.weight, 0);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {/* Available criteria pool */}
      <Card className="p-5">
        <div className="mb-4">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Import Criteria from Templates</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
            Click Import on any criterion to add it to this event. Adjust weight and max score after importing.
          </div>
        </div>
        <div className="space-y-2">
          {templates.map(template => {
            const imported = eventCriteria.some(eventCriterion => eventCriterion.templateId === template.templateId);
            return (
              <div
                key={template.templateId}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{
                  background: imported ? `${COLORS.success}08` : "var(--surface-bg)",
                  border: `1px solid ${imported ? COLORS.success + "30" : COLORS.border}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{template.criterionName}</div>
                  {template.description && (
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>{template.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="px-2 py-0.5 rounded-lg"
                    style={{ fontSize: 11, color: COLORS.textSecondary, background: "var(--glass-bg)", border: `1px solid ${COLORS.border}` }}
                  >
                    W: {template.defaultWeight}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-lg"
                    style={{ fontSize: 11, color: COLORS.textSecondary, background: "var(--glass-bg)", border: `1px solid ${COLORS.border}` }}
                  >
                    Max: {template.maxScore}
                  </span>
                  {imported ? (
                    <div className="flex items-center gap-1.5" style={{ color: COLORS.success }}>
                      <CheckCircle size={13} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Imported</span>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" icon={<Upload size={12} />} onClick={() => onImport({ templateIds: [template.templateId] })}>
                      Import
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Imported criteria with editable weight/maxScore */}
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Event Criteria</div>
        {eventCriteria.length === 0 ? (
          <div
            className="py-8 text-center rounded-xl"
            style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
          >
            No criteria imported yet. Use the panel above to import criteria.
          </div>
        ) : (
          <div className="space-y-2">
            {eventCriteria.map(eventCriterion => (
              <div
                key={eventCriterion.eventCriterionId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex-1 min-w-0">
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{eventCriterion.criterionName}</span>
                    {eventCriterion.description && (
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>{eventCriterion.description}</div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} style={{ color: COLORS.textSecondary }} />
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Weight</span>
                    <input
                      type="number"
                      value={eventCriterion.weight}
                      onChange={e => onUpdate(eventCriterion.eventCriterionId, "weight", Number(e.target.value))}
                      className="rounded-lg px-2 py-1 outline-none"
                      style={{ width: 64, fontSize: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, textAlign: "center" }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award size={12} style={{ color: COLORS.textSecondary }} />
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>Max Score</span>
                    <input
                      type="number"
                      value={eventCriterion.maxScore}
                      onChange={e => onUpdate(eventCriterion.eventCriterionId, "maxScore", Number(e.target.value))}
                      className="rounded-lg px-2 py-1 outline-none"
                      style={{ width: 64, fontSize: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, textAlign: "center" }}
                    />
                  </div>
                  <button
                    onClick={() => onRemove(eventCriterion.eventCriterionId)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    style={{ color: COLORS.error }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: COLORS.border }} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Total weight:{" "}
                <strong style={{ color: totalWeight === 100 ? COLORS.success : COLORS.warning }}>
                  {totalWeight}
                </strong>{" "}
                / 100
              </span>
              <div className="h-px flex-1" style={{ background: COLORS.border }} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
