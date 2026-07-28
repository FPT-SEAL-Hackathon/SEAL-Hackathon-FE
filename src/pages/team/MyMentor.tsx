import { useState, useEffect } from "react";
import { consultationService, MentorProfileResponse, CreateConsultationRequest } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, COLORS } from "@/components/shared/UIComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamConsultations } from "./TeamConsultations";
import { MessageSquare, Send, User, Mail, Briefcase } from "lucide-react";

export function MyMentor({ onNavigate, isLeader, teamId }: { onNavigate?: (p: string) => void; isLeader: boolean; teamId?: string }) {
  const [mentors, setMentors] = useState<MentorProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateConsultationRequest>({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    loadMentors();
  }, [teamId]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const res = await consultationService.getMyMentor();
      if (!res || res.length === 0) {
        setError("No experts have been assigned to your category yet.");
      } else {
        setMentors(res);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load mentors.");
    }
    setLoading(false);
  };

  const openCreateForm = (initialTitle?: string, initialDescription?: string) => {
    if (initialTitle || initialDescription) {
      setCreateForm(prev => ({
        ...prev,
        title: initialTitle || "",
        description: initialDescription || ""
      }));
    }
    setShowCreateForm(true);
  };

  const submitRequest = async () => {
    if (!createForm.title || !createForm.description) return alert("Please fill in title and description");
    
    try {
      await consultationService.createRequest({ ...createForm });
      setShowCreateForm(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM" });
      if (onNavigate) onNavigate("consultations");
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to create request");
    }
  };

  if (loading) return <div>Loading mentor profiles...</div>;

  if (error || mentors.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <User size={48} className="text-gray-300 mb-4" />
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>No Expert Assigned</div>
        <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>{error}</div>
      </Card>
    );
  }
  return (
    <>
      <SectionHeader 
        title="Mentoring Support" 
        subtitle="Consultation and guidance from your assigned experts" 
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => onNavigate?.("team")}>Back to Team</Button>
            {isLeader && !showCreateForm && (
              <Button variant="primary" size="md" icon={<MessageSquare size={16} />} onClick={() => openCreateForm()} style={{ fontWeight: 800 }}>
                New Consultation
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {showCreateForm ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Create Consultation Request</div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-xl" placeholder="e.g. Need help with architecture" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select
                    value={createForm.priority}
                    onValueChange={value => setCreateForm({ ...createForm, priority: value as any })}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border rounded-xl outline-none" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                      <SelectItem value="LOW" style={{ color: COLORS.textPrimary }}>Low</SelectItem>
                      <SelectItem value="MEDIUM" style={{ color: COLORS.textPrimary }}>Medium</SelectItem>
                      <SelectItem value="HIGH" style={{ color: COLORS.textPrimary }}>High</SelectItem>
                      <SelectItem value="URGENT" style={{ color: COLORS.textPrimary }}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} rows={5} className="w-full px-3 py-2 border rounded-xl resize-none" placeholder="Describe your question or problem in detail..." />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="primary" size="md" icon={<Send size={14} />} onClick={submitRequest}>Submit Request</Button>
                  <Button variant="ghost" size="md" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div>
              <TeamConsultations isLeader={isLeader} onNavigate={onNavigate} hideHeader={true} />
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="p-4">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Assigned Experts</div>
            <div className="space-y-4">
              {mentors.map(mentor => (
                <div key={mentor.mentorId} className="flex flex-col border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: COLORS.primary, fontSize: 14, fontWeight: 700 }}>
                      {mentor.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{mentor.fullName}</div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{mentor.categoryName}</div>
                    </div>
                  </div>
                  {mentor.email && (
                    <div className="flex items-center gap-2 mt-1" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      <Mail size={12} /> <span className="truncate">{mentor.email}</span>
                    </div>
                  )}
                  {mentor.department && (
                    <div className="flex items-center gap-2 mt-1" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      <Briefcase size={12} /> <span className="truncate">{mentor.department}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
