import { useState } from "react";
import { PlusCircle, BookOpen } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { CategoryForm } from "./CategoryForm";
import { CategoryCard } from "./CategoryCard";
import { useCategoryContext } from "../../context/CategoryContext";

// ── Tab ────────────────────────────────────────────────────────────────────

export function CategoriesTab() {
  const {
    categories,
    availableMentors,
    categoryMentors,
    loadCategoryMentors,
    createCategory,
    updateCategory,
    deleteCategory,
    assignMentors,
    removeMentor,
  } = useCategoryContext();

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>Categories</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
            Manage competition categories and assign mentors.
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setShowForm(true)}>
          New Category
        </Button>
      </div>

      {showForm && (
        <CategoryForm
          initial={{
            categoryName: "",
            description: "",
            sortOrder: categories.length + 1,
          }}
          onSave={async (data) => {
            await createCategory(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {categories.length === 0 && !showForm ? (
        <Card className="p-10 flex flex-col items-center justify-center gap-3">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 56, height: 56, background: `${COLORS.secondary}12` }}
          >
            <BookOpen size={24} style={{ color: COLORS.secondary }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>No categories yet</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            Create your first category to organize competition tracks.
          </div>
          <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setShowForm(true)}>
            Add Category
          </Button>
        </Card>
      ) : (
        categories
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(category => (
            <CategoryCard
              key={category.categoryId}
              category={category}
              availableMentors={availableMentors}
              mentors={categoryMentors[category.categoryId] ?? []}
              loadCategoryMentors={loadCategoryMentors}
              onAssignMentor={assignMentors}
              onRemoveMentor={removeMentor}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
            />
          ))
      )}
    </div>
  );
}
