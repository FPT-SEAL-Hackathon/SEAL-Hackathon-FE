import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { PlusCircle, Loader, User, Mail, Trash2 } from "lucide-react";
import { SectionHeader, Card, Button, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import { categoryService, type CategoryMentorResponse } from "@/features/categories/api/categoryService";
import { parseApiError } from "@/lib/api/apiClient";
import { toast } from "sonner";

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
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (mentorId: string) => {
    if (!selectedCategoryId) return;
    setRemovingId(mentorId);
    setError("");
    try {
      await categoryService.removeMentor(selectedCategoryId, mentorId);
      // Reload the mentors list
      const updatedMentors = await categoryService.getMentors(selectedCategoryId);
      setMentors(updatedMentors);
    } catch (err) {
      const errMsg = parseApiError(err).message;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setRemovingId(null);
    }
  };

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
      .catch(err => {
        const errMsg = parseApiError(err).message;
        setError(errMsg);
        toast.error(errMsg);
      })
      .finally(() => setLoading(false));
  }, [selectedCategoryId, context.mentorAssignmentReloadKey]);

  return (
    <>
      <SectionHeader 
        title="Mentor Assignments" 
        subtitle="Manage mentors assigned to categories" 
        action={
          <div className="flex items-center gap-3">
            <Select value={selectedEventId || "" || "none"} onValueChange={(value) => context.setSelectedEventId((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select an Event</SelectItem>
              {context.apiEvents?.map((evt: any) => (
                <SelectItem key={evt.eventId} value={evt.eventId} style={{ color: COLORS.textPrimary }}>{evt.eventName}</SelectItem>
              ))}
  </SelectContent>
</Select>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<PlusCircle size={14} />} 
              onClick={() => setAssignMentorModal({ open: true, categoryId: selectedCategoryId })}
              disabled={!selectedCategoryId}
            >
              Assign Mentor
            </Button>
          </div>
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
              <div className="text-center p-4 text-sm" style={{ color: COLORS.textSecondary }}>No categories found</div>
            )}
          </div>
          
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Assigned Mentors</div>
              {loading && <Loader size={14} className="animate-spin" style={{ color: COLORS.textSecondary }} />}
            </div>
            
            {error && (
              <Card className="p-4 bg-red-500/10 text-red-500 text-sm border-red-500/20">{error}</Card>
            )}
            
            {!loading && mentors.length === 0 && (
              <Card className="p-8 text-center flex flex-col items-center justify-center gap-2" style={{ borderStyle: "dashed" }}>
                <User size={24} style={{ color: COLORS.textSecondary, opacity: 0.5 }} />
                <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No mentors assigned to this category yet</div>
              </Card>
            )}

            {!loading && mentors.map((m: any) => {
              const mentorId = m.expertId || m.mentorId;
              const isRemoving = removingId === mentorId;
              return (
                <Card key={m.categoryExpertId || m.categoryMentorId} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.primary}20`, color: COLORS.primary, fontWeight: 700 }}>
                      {(m.expertName || m.mentorName || "M")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{m.expertName || m.mentorName}</div>
                      <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                        <Mail size={12} />
                        {m.expertEmail || m.mentorEmail}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    icon={isRemoving ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    disabled={isRemoving}
                    onClick={() => handleRemove(mentorId)}
                  >
                    Remove
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
