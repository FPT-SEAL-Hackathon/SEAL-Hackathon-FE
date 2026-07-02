import { useEffect, useState } from "react";
import { PlusCircle, Loader, User, Mail, Trash2 } from "lucide-react";
import { SectionHeader, Card, Button, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import { categoryService, type CategoryMentorResponse } from "@/features/categories/api/categoryService";

interface AdminViewProps {
  context: any;
}

export function AdminMentorAssignmentsView({ context }: AdminViewProps) {
  const {
    t,
    selectedEventId,
    apiCategories,
    setAssignMentorModal,
  } = context;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [mentors, setMentors] = useState<CategoryMentorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (apiCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(apiCategories[0].categoryId);
    }
  }, [apiCategories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setMentors([]);
      return;
    }
    setLoading(true);
    setError("");
    categoryService.getMentors(selectedCategoryId)
      .then(setMentors)
      .catch(err => setError(err instanceof Error ? err.message : "Failed to load mentors"))
      .finally(() => setLoading(false));
  }, [selectedCategoryId, context.mentorAssignmentReloadKey]);

  return (
    <>
      <SectionHeader 
        title="Mentor Assignments" 
        subtitle="Manage mentors assigned to categories" 
        action={
          <Button 
            variant="primary" 
            size="sm" 
            icon={<PlusCircle size={14} />} 
            onClick={() => setAssignMentorModal({ open: true, categoryId: selectedCategoryId })}
            disabled={!selectedCategoryId}
          >
            Assign Mentor
          </Button>
        }
      />
      
      {!selectedEventId ? (
        <Card className="p-8 text-center" style={{ color: COLORS.textSecondary }}>
          Select an event to view categories and mentors.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Categories</div>
            {apiCategories.map((cat: any) => (
              <div 
                key={cat.categoryId} 
                onClick={() => setSelectedCategoryId(cat.categoryId)}
                className="p-3 rounded-xl cursor-pointer transition-colors"
                style={{ 
                  background: selectedCategoryId === cat.categoryId ? `${COLORS.primary}15` : COLORS.bg,
                  border: `1px solid ${selectedCategoryId === cat.categoryId ? COLORS.primary : COLORS.border}`,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: selectedCategoryId === cat.categoryId ? COLORS.primary : COLORS.textPrimary }}>
                  {cat.categoryName}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }} className="mt-1 line-clamp-1">
                  {cat.description || "No description"}
                </div>
              </div>
            ))}
            {apiCategories.length === 0 && (
              <div className="p-4 text-center text-sm" style={{ color: COLORS.textSecondary, border: `1px dashed ${COLORS.border}`, borderRadius: 12 }}>
                No categories found for this event.
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Assigned Mentors</div>
                {loading && <Loader size={16} className="animate-spin text-primary" />}
              </div>
              
              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              
              {!selectedCategoryId ? (
                <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
                  Select a category to view its assigned mentors.
                </div>
              ) : mentors.length === 0 && !loading ? (
                <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
                  No mentors assigned to this category yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {mentors.map(mentor => (
                    <div key={mentor.categoryMentorId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.success}20`, color: COLORS.success }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                            {mentor.mentorName || "Unknown Mentor"}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                            <Mail size={12} /> {mentor.mentorEmail || mentor.mentorId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                          Assigned: {new Date(mentor.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
