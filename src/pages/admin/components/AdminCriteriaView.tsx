import { PlusCircle } from "lucide-react";
import { Card, SectionHeader, COLORS, Button } from "@/components/shared/UIComponents";
import { useCriteriaTemplateContext } from "@/features/criteriaTemplates/context/CriteriaTemplateContext";
import { useState } from "react";
import { CriteriaTemplateForm } from "@/features/criteriaTemplates/components/CriteriaTemplateForm";
import { CriteriaTemplateCard } from "@/features/criteriaTemplates/components/CriteriaTemplateCard";
import { CriteriaTemplate } from "@/features/criteriaTemplates/types/template";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface AdminViewProps {
  context: any;
}

export function AdminCriteriaView({context} : AdminViewProps) {
  const { t } = context;
  const {
    templates, 
    createTemplate,
    deleteTemplate,
  } = useCriteriaTemplateContext();

  const [showCreate, setShowCreate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<CriteriaTemplate | null>(null);

  return (
    <>
      <SectionHeader
        title={t("admin.criteriaTemplates")}
        subtitle={t("admin.criteriaTemplatesSubtitle")}
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setShowCreate(true)} >{t("common.newTemplate")}</Button>}
      />

      {showCreate && (
        <CriteriaTemplateForm 
          mode="create"
          initial={{
            criterionName: "",
            description: "",
            defaultWeight: 0,
            maxScore: 10,
          }}
          onSave={async (data) => {
            await createTemplate(data);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <Card className="p-8 text-center">
            <span style={{ color: COLORS.textSecondary }}>
              {t("common.noData") || "No criteria templates found."}
            </span>
          </Card>
        ) : (
          templates.map(template => (
            <CriteriaTemplateCard 
              key={template.templateId}
              template={template}
              onDelete={setDeletingTemplate}
            />
          ))
        )}

        {deletingTemplate && (
          <ConfirmDialog
              title="Delete Criteria Template"
              message={`Delete "${deletingTemplate.criterionName}"?`}

              confirmText="Delete"

              onCancel={() => setDeletingTemplate(null)}

              onConfirm={async () => {
                  await deleteTemplate(deletingTemplate.templateId);
                  setDeletingTemplate(null);
              }}
          />
        )}
      </div>
    </>
  );
}
