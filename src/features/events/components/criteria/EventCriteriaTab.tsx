import { CheckCircle, Trash2, Upload, SlidersHorizontal, Award } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import type { EventCriteria, ImportCriteriaRequest } from "../../types/eventCriteria";
import { CriteriaTemplate } from "../../../criteriaTemplates/types/template";
import { useState } from "react";
import { useEventCriteriaContext } from "../../context/EventCriteriaContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EventCriterionRow } from "./EventCriterionRow";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api/apiClient";

export function CriteriaTab() {
  const {
    criteriaTemplates, 
    eventCriteria,
    importCriteria,
    updateEventCriteria,
    removeEventCriteria
  } = useEventCriteriaContext();

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [removingEventCriterion, setRemovingEventCriterion] = useState<EventCriteria | null>(null);

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
          {criteriaTemplates.map(template => {
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
                    <Button variant="primary" size="sm" icon={<Upload size={12} />} onClick={async () => {
                      try {
                        await importCriteria({ templateIds: [template.templateId]});
                        toast.success("Criteria imported.");
                      } catch (error) {
                        toast.error(parseApiError(error).message || "Failed to import criteria");
                      }
                    }}>
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
              <EventCriterionRow
                key={eventCriterion.eventCriterionId}
                criterion={eventCriterion}
                onDelete={setRemovingEventCriterion}
              />
            ))}
          </div>
        )}
      </Card>
      {removingEventCriterion && (
        <ConfirmDialog
            title="Remove Criterion"
            message={`Remove "${removingEventCriterion.criterionName}" from this event?`}
            confirmText="Remove"
            confirmVariant="danger"
            onCancel={() => setRemovingEventCriterion(null)}
            onConfirm={async () => {
                try {
                  await removeEventCriteria(removingEventCriterion.eventCriterionId);
                  toast.success("Criteria removed.");
                  setRemovingEventCriterion(null);
                } catch (error) {
                  toast.error(parseApiError(error).message || "Failed to remove criteria");
                }
            }}
        />
      )}
    </div>
  );
}
