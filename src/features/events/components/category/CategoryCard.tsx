import { useState } from "react";
import { PlusCircle, Edit, Trash2, Save, X, ChevronDown, ChevronRight, BookOpen, Users } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { AssignModal } from "../../shared/ui/shared";
import { AssignMentorsRequest, Category, CategoryMentor, Mentor } from "../../types/category";
import { CategoryForm } from "./CategoryForm";
import { CategoryRequest } from "../../types/category";
// ── Category card ──────────────────────────────────────────────────────────
interface Props {
    category: Category;
    availableMentors: Mentor[];
    mentors: CategoryMentor[];
    loadCategoryMentors: (categoryId: string) => Promise<void>;
    onUpdate: (id: string, data: CategoryRequest) => Promise<void>;
    onDelete: (id: string) => void; 
    onAssignMentor: (
        categoryId: string,
        mentorIds: AssignMentorsRequest
    ) => Promise<void>;
    onRemoveMentor: (categoryId: string, mentorId: string) => Promise<void>;
}
export function CategoryCard({
  category,
  availableMentors,
  mentors,
  loadCategoryMentors,
  onUpdate, 
  onDelete,
  onAssignMentor,
  onRemoveMentor,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);

  const handleAssignMentor = async (mentor: Mentor) => {
    console.log(mentor);
    await onAssignMentor(category.categoryId, {
        mentorIds: [mentor.id]
    });
  };

  const handleRemoveMentor = async (mentorId: string) => {
    await onRemoveMentor(category.categoryId, mentorId);
  };

  if (editing) {
    return (
      <CategoryForm
        initial={{
            categoryName: category.categoryName,
            description: category.description,
            sortOrder: category.sortOrder
        }}
        onSave={ async data => { 
            await onUpdate(
                category.categoryId,
                data
            ); 
            setEditing(false); 
        }}

        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {showMentorModal && (
        <AssignModal
          title="Assign Mentors"
          allPeople={availableMentors}
          assignedIds={mentors.map(m => m.mentorId)}
          onAssign={handleAssignMentor}
          onRemove={handleRemoveMentor}
          onClose={() => setShowMentorModal(false)}
        />
      )}
      <Card className="mb-4 overflow-hidden">
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
          style={{ userSelect: "none" }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: `${COLORS.secondary}15` }}
          >
            <BookOpen size={16} style={{ color: COLORS.secondary }} />
          </div>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{category.categoryName}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              Sort #{category.sortOrder} • {/*{rounds.length}*/} rounds • {mentors.length} mentors
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" icon={<Users size={12} />} onClick={() => setShowMentorModal(true)}>Mentors</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => onDelete(category.categoryId)}>Delete</Button>
          </div>
          {expanded
            ? <ChevronDown size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
            : <ChevronRight size={15} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />}
        </div>

        {expanded && (
          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            {category.description && (
              <p className="pt-3 pb-1" style={{ fontSize: 13, color: COLORS.textSecondary }}>{category.description}</p>
            )}

            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>Assigned Mentors</span>
                <Button variant="outline" size="sm" icon={<Users size={12} />} onClick={() => setShowMentorModal(true)}>
                  Manage Mentors
                </Button>
              </div>
              {mentors.length === 0 ? (
                <div
                  className="py-3 text-center rounded-xl"
                  style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
                >
                  No mentors assigned
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mentors.map(m => (
                    <div
                      key={m.categoryMentorId}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ background: `${COLORS.secondary}10`, border: `1px solid ${COLORS.secondary}25` }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.secondary }}>{m.fullName}</span>
                      <button onClick={() => handleRemoveMentor(m.mentorId)} style={{ color: COLORS.secondary }}>
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