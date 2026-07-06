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
    if (apiCategories.length > 0) {
      const isValid = apiCategories.some((c: any) => c.categoryId === selectedCategoryId);
      if (!isValid) {
        setSelectedCategoryId(apiCategories[0].categoryId);
      }
    } else {
      setSelectedCategoryId("");
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
        title="Expert Assignments" 
        subtitle="Manage experts assigned to categories" 
        action={
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded-xl outline-none text-sm font-medium cursor-pointer"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              value={selectedEventId || ""}
              onChange={(e) => context.setSelectedEventId(e.target.value)}
            >
              <option value="" disabled>Select an Event</option>
              {context.apiEvents?.map((evt: any) => (
                <option key={evt.eventId} value={evt.eventId}>{evt.eventName}</option>
              ))}
            </select>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<PlusCircle size={14} />} 
              onClick={() => setAssignMentorModal({ open: true, categoryId: selectedCategoryId })}
              disabled={!selectedCategoryId}
            >
              Assign Expert
            </Button>
          </div>
        }
      />
      
      {!selectedEventId ? (
        <Card className="p-8 text-center" style={{ color: COLORS.textSecondary }}>
          Select an event to view categories and experts.
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
              <div className="text-center p-4 text-sm" style={{ color: COLORS.textSecondary }}>No categories found</div>
            )}
          </div>
          
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Assigned Experts</div>
              {loading && <Loader size={14} className="animate-spin" style={{ color: COLORS.textSecondary }} />}
            </div>
            
            {error && (
              <Card className="p-4 bg-red-500/10 text-red-500 text-sm border-red-500/20">{error}</Card>
            )}
            
            {!loading && mentors.length === 0 && (
              <Card className="p-8 text-center flex flex-col items-center justify-center gap-2" style={{ borderStyle: "dashed" }}>
                <User size={24} style={{ color: COLORS.textSecondary, opacity: 0.5 }} />
                <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No experts assigned to this category yet</div>
              </Card>
            )}

            {!loading && mentors.map((m: any) => (
              <Card key={m.categoryExpertId || m.categoryMentorId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.primary}20`, color: COLORS.primary, fontWeight: 700 }}>
                    {(m.expertName || m.mentorName || "E")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{m.expertName || m.mentorName}</div>
                    <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      <Mail size={12} />
                      {m.expertEmail || m.mentorEmail}
                    </div>
                  </div>
                </div>
                <Button variant="danger" size="sm" icon={<Trash2 size={13} />}>Remove</Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
