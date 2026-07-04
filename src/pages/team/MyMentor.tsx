import { useState, useEffect } from "react";
import { consultationService, MentorProfileResponse, CreateConsultationRequest } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, COLORS } from "@/components/shared/UIComponents";
import { MessageSquare, Send, User, Mail, Briefcase } from "lucide-react";

export function MyMentor({ onNavigate, isLeader }: { onNavigate?: (p: string) => void; isLeader: boolean }) {
  const [mentors, setMentors] = useState<MentorProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfileResponse | null>(null);
  const [createForm, setCreateForm] = useState<CreateConsultationRequest>({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const res = await consultationService.getMyMentor();
      if (!res || res.length === 0) {
        setError("No mentors have been assigned to your category yet.");
      } else {
        setMentors(res);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load mentors.");
    }
    setLoading(false);
  };

  const openCreateForm = (mentor: MentorProfileResponse) => {
    setSelectedMentor(mentor);
    setShowCreateForm(true);
  };

  const submitRequest = async () => {
    if (!createForm.title || !createForm.description) return alert("Please fill in title and description");
    if (!selectedMentor) return alert("Please select a mentor");
    
    try {
      await consultationService.createRequest({ ...createForm, mentorId: selectedMentor.mentorId });
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
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>No Mentor Assigned</div>
        <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }}>{error}</div>
      </Card>
    );
  }

  if (showCreateForm && selectedMentor) {
    return (
      <>
        <SectionHeader title="Create Consultation Request" subtitle={`Send a request to ${selectedMentor.fullName}`} />
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-xl" placeholder="e.g. Need help with architecture" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
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
      </>
    );
  }

  return (
    <>
      <SectionHeader title="My Mentors" subtitle="Your assigned mentors for consultation and guidance" />
      <div className="space-y-6">
        {mentors.map(mentor => (
          <div key={mentor.mentorId} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 p-6 text-center">
              <div className="mx-auto flex items-center justify-center rounded-full text-white mb-4" style={{ width: 80, height: 80, background: COLORS.primary, fontSize: 24, fontWeight: 700 }}>
                {mentor.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{mentor.fullName}</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Mentor • {mentor.categoryName}</div>
              
              <div className="mt-6 flex flex-col gap-3">
                {isLeader ? (
                  <Button variant="primary" size="md" className="w-full justify-center" icon={<MessageSquare size={14} />} onClick={() => openCreateForm(mentor)}>
                    New Consultation
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">Only Team Leader can create requests.</div>
                )}
                <Button variant="outline" size="md" className="w-full justify-center" onClick={() => onNavigate?.("consultations")}>
                  View Request History
                </Button>
              </div>
            </Card>

            <Card className="col-span-2 p-6 space-y-6">
              <div style={{ fontWeight: 700, fontSize: 16 }}>Mentor Information</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50"><Mail size={16} className="text-gray-500" /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>EMAIL</div>
                    <div style={{ fontSize: 13 }}>{mentor.email}</div>
                  </div>
                </div>
                {mentor.department && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50"><Briefcase size={16} className="text-gray-500" /></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>DEPARTMENT / INSTITUTION</div>
                      <div style={{ fontSize: 13 }}>{mentor.department}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>BIO & EXPERTISE</div>
                <div style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.5 }}>
                  {mentor.bio || "No bio provided."}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
