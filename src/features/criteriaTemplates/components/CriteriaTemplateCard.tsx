import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Card, Button, COLORS, StatusBadge, } from "../../../components/shared/UIComponents";
import { CriteriaTemplateForm } from "./CriteriaTemplateForm";
import { useCriteriaTemplateContext } from "../context/CriteriaTemplateContext"; 
import { CriteriaTemplate, TemplateRequest} from "../types/template";

interface Props {
  template: CriteriaTemplate;
  onDelete: (template: CriteriaTemplate) => void;
}

export function CriteriaTemplateCard({
  template,
  onDelete
}: Props) {
  const [editing, setEditing] = useState(false);

  const {
    updateTemplate,
  } = useCriteriaTemplateContext();

  if (editing) {
    return (
      <CriteriaTemplateForm
        mode="edit"
        initial={{
          criterionName: template.criterionName,
          description: template.description ?? "",
          defaultWeight: template.defaultWeight,
          maxScore: template.maxScore,
        }}
        onSave={async (data: TemplateRequest) => {
          await updateTemplate(
            template.templateId,
            data
          );

          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: COLORS.textPrimary,
            }}
          >
            {template.criterionName}
          </div>

          <div
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
          >
            {template.description || "No description"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={template.isActive ? "active" : "inactive"}
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<Edit size={13} />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => onDelete(template)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className="px-2 py-1 rounded-xl text-xs font-medium"
          style={{
            background: `${COLORS.primary}10`,
            color: COLORS.primary,
          }}
        >
          Weight ({template.defaultWeight})
        </span>

        <span
          className="px-2 py-1 rounded-xl text-xs font-medium"
          style={{
            background: `${COLORS.primary}10`,
            color: COLORS.primary,
          }}
        >
          Max Score ({template.maxScore})
        </span>
      </div>
    </Card>
  );
}