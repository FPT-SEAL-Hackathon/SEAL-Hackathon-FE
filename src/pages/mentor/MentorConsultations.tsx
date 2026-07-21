import { useState, useEffect, useMemo } from "react";
import {
  consultationService,
  ConsultationRequestResponse,
  ConsultationMessageResponse,
  ConsultationPriority,
} from "@/features/consultation/api/consultationService";
import { milestoneService, type MilestoneResponse } from "@/features/teams/api/milestoneService";
import { SectionHeader, Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import {
  MessageSquare, Send, CheckCircle, XCircle,
  PlayCircle, ArrowLeft, Search, SlidersHorizontal, X,
  Target, FileText, PlusCircle, Trash2, Circle, Save, Loader, Users, BrainCircuit
} from "lucide-react";
import { aiService } from "@/features/ai/api/aiService";
import { useAuth } from "@/features/auth/store/authStore";
import { MentorProfileResponse } from "@/features/consultation/api/consultationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RequestAction = "ACCEPT" | "REJECT" | "IN_PROGRESS" | "RESOLVE";

const MESSAGEABLE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];
const CLOSED_STATUSES = ["RESOLVED", "REJECTED", "CANCELLED"];

const PRIORITY_COLORS: Record<ConsultationPriority, string> = {
  URGENT: "#e53e2e",
  HIGH:   "#f47920",
  MEDIUM: "#d4a017",
  LOW:    "#009444",
};

const PRIORITY_OPTIONS: { label: string; value: ConsultationPriority | "none" }[] = [
  { label: "All Priorities", value: "none" },
  { label: "🔴 Urgent",  value: "URGENT" },
  { label: "🟠 High",    value: "HIGH"   },
  { label: "🟡 Medium",  value: "MEDIUM" },
  { label: "🟢 Low",     value: "LOW"    },
];

const STATUS_OPTIONS = [
  { label: "All Statuses",   value: "none" },
  { label: "Pending",        value: "PENDING"     },
  { label: "Accepted",       value: "ACCEPTED"    },
  { label: "In Progress",    value: "IN_PROGRESS" },
  { label: "Resolved",       value: "RESOLVED"    },
  { label: "Rejected",       value: "REJECTED"    },
  { label: "Cancelled",      value: "CANCELLED"   },
];

const getRequestBadgeStatus = (status: ConsultationRequestResponse["status"]) => {
  const map: Record<ConsultationRequestResponse["status"], string> = {
    PENDING:     "pending",
    ACCEPTED:    "approved",
    IN_PROGRESS: "in_progress",
    RESOLVED:    "completed",
    REJECTED:    "rejected",
    CANCELLED:   "closed",
  };
  return map[status];
};

const selectStyle: React.CSSProperties = {
  background: "var(--surface-input, #f9f6f1)",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
  borderRadius: 10,
  padding: "7px 12px",
  fontSize: 13,
  outline: "none",
  cursor: "pointer",
  minWidth: 148,
};

// ─── Milestone panel ───────────────────────────────────────────────────────────
function MilestonePanel({ requestId, onToggle }: { requestId: string; onToggle?: () => void }) {
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    setLoading(true);
    milestoneService.getByTeam(requestId)
      .then(setMilestones)
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, [requestId]);

  const addMilestone = async () => {
    const label = newText.trim();
    if (!label) return;
    try {
      const created = await milestoneService.create(requestId, label);
      setMilestones(prev => [...prev, created]);
      setNewText("");
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (milestoneId: string) => {
    try {
      const updated = await milestoneService.toggle(requestId, milestoneId);
      setMilestones(prev => prev.map(m => m.milestoneId === milestoneId ? updated : m));
      onToggle?.();
    } catch (e: any) {
      console.error("Failed to toggle milestone", e);
    }
  };

  const doneCount = milestones.filter(m => m.isDone).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: COLORS.primary }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>Milestones</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: milestones.length > 0 && doneCount === milestones.length ? COLORS.success : COLORS.primary }}>
          {doneCount}/{milestones.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full mb-3" style={{ height: 4, background: `${COLORS.border}60` }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: milestones.length ? `${(doneCount / milestones.length) * 100}%` : "0%", background: COLORS.success }}
        />
      </div>

      <div className="space-y-1.5">
        {loading ? (
          <div className="flex items-center gap-2" style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            <Loader size={12} className="animate-spin" /> Loading...
          </div>
        ) : milestones.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" }}>No milestones yet.</div>
        ) : milestones.map(m => (
          <div
            key={m.milestoneId}
            onClick={() => handleToggle(m.milestoneId)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 group transition-colors cursor-pointer hover:bg-gray-50"
            style={{ background: m.isDone ? `${COLORS.success}08` : COLORS.bg, border: `1px solid ${m.isDone ? COLORS.success + "40" : COLORS.border}` }}
          >
            <div style={{ flexShrink: 0, lineHeight: 0 }}>
              {m.isDone
                ? <CheckCircle size={15} style={{ color: COLORS.success }} />
                : <Circle size={15} style={{ color: COLORS.border }} />
              }
            </div>
            <span className="flex-1 break-words min-w-0" style={{
              fontSize: 13, color: m.isDone ? COLORS.textSecondary : COLORS.textPrimary,
              textDecoration: m.isDone ? "line-through" : "none",
            }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2 mt-3">
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addMilestone()}
          placeholder="Add milestone..."
          className="flex-1 px-2.5 py-1.5 rounded-lg outline-none"
          style={{ fontSize: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
        />
        <Button variant="outline" size="sm" icon={<PlusCircle size={12} />} onClick={addMilestone} disabled={!newText.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Note panel ────────────────────────────────────────────────────────────────
function NotePanel({ requestId }: { requestId: string }) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    consultationService.getTeamNote(requestId)
      .then(res => setNoteText(res.note || ""))
      .catch(() => setNoteText(""))
      .finally(() => setLoading(false));
  }, [requestId]);

  const saveNote = async () => {
    setSaving(true);
    try {
      await consultationService.updateTeamNote(requestId, noteText);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} style={{ color: COLORS.primary }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>Consultation Note</span>
      </div>
      <textarea
        value={loading ? "Loading..." : noteText}
        onChange={e => setNoteText(e.target.value)}
        disabled={loading}
        rows={6}
        placeholder="Add private notes for this team..."
        className="w-full px-3 py-2 rounded-xl outline-none resize-none"
        style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
      />
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="primary" size="sm"
          icon={saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
          onClick={saveNote}
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Note"}
        </Button>
        {saved && <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>✓ Saved!</span>}
      </div>
    </div>
  );
}

// ─── Mentors in Room Panel ──────────────────────────────────────────────────
function MentorsInRoomPanel({ categoryId }: { categoryId: string }) {
  const [mentors, setMentors] = useState<MentorProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    consultationService.getMentorsOfCategory(categoryId)
      .then(setMentors)
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} style={{ color: COLORS.primary }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>Mentors in Room</span>
        <span style={{ fontSize: 11, background: `${COLORS.primary}20`, color: COLORS.primary, padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>
          {mentors.length}
        </span>
      </div>
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2" style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            <Loader size={12} className="animate-spin" /> Loading...
          </div>
        ) : mentors.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" }}>No mentors assigned.</div>
        ) : mentors.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: COLORS.primary, fontSize: 10, fontWeight: 700 }}>
              {(m.fullName || "M")[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }} className="truncate">{m.fullName}</div>
              {m.email && <div style={{ fontSize: 11, color: COLORS.textSecondary }} className="truncate">{m.email}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function MentorConsultations({ onNavigate: _onNavigate }: { onNavigate?: (p: string) => void }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequestResponse | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageResponse[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [teachAiModal, setTeachAiModal] = useState<{ open: boolean, standardAnswer: string }>({ open: false, standardAnswer: "" });
  const [teachAiQuestion, setTeachAiQuestion] = useState("");
  const [teachingAi, setTeachingAi] = useState(false);

  // ── Filters ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<ConsultationPriority | "">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const page = await consultationService.getMentorRequests({ size: 100 });
      setRequests(page.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach(r => {
      if (r.categoryId) map.set(r.categoryId, `${r.eventName} — ${r.categoryName}`);
    });
    return [{ id: "none", label: "All Categories" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))];
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !r.teamName.toLowerCase().includes(q)) return false;
      if (filterPriority && r.priority !== filterPriority) return false;
      if (filterCategory && r.categoryId !== filterCategory) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [requests, search, filterPriority, filterCategory, filterStatus]);

  const hasFilters = !!(search || filterPriority || filterCategory || filterStatus);
  const clearFilters = () => { setSearch(""); setFilterPriority(""); setFilterCategory(""); setFilterStatus(""); };

  const openRequestDetail = async (req: ConsultationRequestResponse) => {
    setSelectedRequest(req);
    setMessages([]);
    setRejectReason("");
    setShowRejectInput(false);
    try {
      const msgs = await consultationService.getMessages(req.id);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const updateRequestState = (updated: ConsultationRequestResponse) => {
    setSelectedRequest(updated);
    setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  };

  const handleAction = async (action: RequestAction) => {
    if (!selectedRequest) return;
    try {
      let updated: ConsultationRequestResponse | null = null;
      if (action === "ACCEPT") {
        updated = await consultationService.acceptRequest(selectedRequest.id);
      } else if (action === "REJECT") {
        const reason = rejectReason.trim();
        if (!reason) return alert("Please provide a reason");
        updated = await consultationService.rejectRequest(selectedRequest.id, reason);
        setShowRejectInput(false);
        setRejectReason("");
      } else if (action === "IN_PROGRESS") {
        updated = await consultationService.markInProgress(selectedRequest.id);
      } else if (action === "RESOLVE") {
        updated = await consultationService.resolveRequest(selectedRequest.id);
      }
      if (updated) updateRequestState(updated);
    } catch (e) {
      console.error(e);
      alert("Action failed");
    }
  };

  const reloadMessages = async () => {
    if (!selectedRequest) return;
    try {
      const msgs = await consultationService.getMessages(selectedRequest.id);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !selectedRequest) return;
    try {
      const msg = await consultationService.sendMessage(selectedRequest.id, { content });
      setMessages(prev => [...prev, msg]);
      setMessageInput("");
    } catch (e) { console.error(e); }
  };

  // ── Detail view ─────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setSelectedRequest(null)}>Back</Button>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{selectedRequest.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Team: <b>{selectedRequest.teamName}</b>
              {" · "}{selectedRequest.categoryName} ({selectedRequest.eventName})
              {" · "}
              <span style={{ fontWeight: 600, color: PRIORITY_COLORS[selectedRequest.priority] }}>
                {selectedRequest.priority}
              </span>
            </div>
          </div>
          <StatusBadge status={getRequestBadgeStatus(selectedRequest.status)} />
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* ── Chat panel (left, 2/3) ── */}
          <div className="w-2/3 flex flex-col bg-white rounded-xl border min-w-0" style={{ borderColor: COLORS.border }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-xl mb-4" style={{ background: `${COLORS.primary}10` }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Description</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>{selectedRequest.description}</div>
              </div>

              {messages.map((m, i) => {
                const isAi = m.content?.startsWith("[AI Mentor]") || m.senderName === "null" || !m.senderId;
                const isMe = !isAi && m.senderId === user?.userId;
                return (
                  <div key={m.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }} className="flex items-center gap-1">
                      {isAi && <BrainCircuit size={12} style={{ color: COLORS.primary }} />}
                      {isAi ? "AI Mentor" : m.senderName || "System"} · {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className={`flex items-center gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                      <div className="px-4 py-2 rounded-2xl break-words whitespace-pre-wrap" style={{
                        background: isAi ? `${COLORS.primary}15` : (isMe ? COLORS.primary : COLORS.bg),
                        color: isMe && !isAi ? "#fff" : COLORS.textPrimary,
                        border: isAi ? `1px solid ${COLORS.primary}40` : (isMe ? "none" : `1px solid ${COLORS.border}`)
                      }}>
                        {m.content?.replace("[AI Mentor]: ", "")}
                      </div>
                      {isMe && !isAi && (
                        <button 
                          onClick={() => setTeachAiModal({ open: true, standardAnswer: m.content })}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                          title="Save as AI Knowledge"
                        >
                          <BrainCircuit size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {MESSAGEABLE_STATUSES.includes(selectedRequest.status) && (
              <div className="p-4 border-t flex gap-2" style={{ borderColor: COLORS.border }}>
                <input
                  type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl outline-none border"
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <Button variant="primary" size="md" icon={<Send size={14} />} onClick={sendMessage}>Send</Button>
              </div>
            )}

            {CLOSED_STATUSES.includes(selectedRequest.status) && (
              <div className="p-3 border-t text-center text-sm text-gray-500" style={{ borderColor: COLORS.border }}>
                This request is closed.
              </div>
            )}
          </div>

          {/* ── Right panel (1/3): Actions + Milestone + Note ── */}
          <div className="w-1/3 flex flex-col gap-4 overflow-y-auto min-w-0 pr-1 pb-4">
            {/* Request Actions */}
            <Card className="p-4 flex-shrink-0">
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 10 }}>Request Actions</div>
              <div className="space-y-2">
                {selectedRequest.status === "PENDING" && (
                  <>
                    <Button className="w-full justify-center" variant="primary" size="md" icon={<CheckCircle size={14} />} onClick={() => handleAction("ACCEPT")}>
                      Accept Request
                    </Button>
                    {!showRejectInput ? (
                      <Button className="w-full justify-center" variant="outline" size="md" icon={<XCircle size={14} />} onClick={() => setShowRejectInput(true)}>
                        Reject
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason..." className="px-3 py-2 border rounded text-sm" />
                        <div className="flex gap-2">
                          <Button className="flex-1 justify-center" variant="primary" size="sm" onClick={() => handleAction("REJECT")}>Confirm</Button>
                          <Button className="flex-1 justify-center" variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedRequest.status === "ACCEPTED" && (
                  <Button className="w-full justify-center" variant="primary" size="md" icon={<PlayCircle size={14} />} onClick={() => handleAction("IN_PROGRESS")}>
                    Mark In Progress
                  </Button>
                )}
                {(selectedRequest.status === "ACCEPTED" || selectedRequest.status === "IN_PROGRESS") && (
                  <Button className="w-full justify-center" variant="outline" size="md" icon={<CheckCircle size={14} />} onClick={() => handleAction("RESOLVE")}>
                    Resolve
                  </Button>
                )}
                {CLOSED_STATUSES.includes(selectedRequest.status) && (
                  <div className="text-center text-sm text-gray-500 py-1">This request is closed.</div>
                )}
              </div>
            </Card>

            <Card className="p-4 flex-shrink-0">
              <MentorsInRoomPanel categoryId={selectedRequest.categoryId} />
            </Card>

            {/* Milestones */}
            <Card className="p-4 flex-shrink-0">
              <MilestonePanel requestId={selectedRequest.id} onToggle={reloadMessages} />
            </Card>

            {/* Note */}
            <Card className="p-4 flex-shrink-0">
              <NotePanel requestId={selectedRequest.id} />
            </Card>
          </div>
        </div>

        {teachAiModal.open && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <h3 className="font-bold flex items-center gap-2" style={{ color: COLORS.textPrimary }}><BrainCircuit size={18} style={{color: COLORS.primary}}/> Teach AI Mentor</h3>
                <button onClick={() => setTeachAiModal({open: false, standardAnswer: ""})}><X size={18}/></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-bold block mb-1" style={{color: COLORS.textSecondary}}>If a student asks something like:</label>
                  <input 
                    type="text"
                    value={teachAiQuestion}
                    onChange={e => setTeachAiQuestion(e.target.value)}
                    placeholder="e.g. Làm sao để nộp bài? ..."
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1" style={{color: COLORS.textSecondary}}>AI should answer exactly this:</label>
                  <div className="p-3 rounded-xl text-sm" style={{background: `${COLORS.primary}10`, color: COLORS.textPrimary}}>
                    {teachAiModal.standardAnswer}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <Button variant="outline" size="sm" onClick={() => setTeachAiModal({open: false, standardAnswer: ""})}>Cancel</Button>
                <Button variant="primary" size="sm" icon={teachingAi ? <Loader size={14} className="animate-spin"/> : <BrainCircuit size={14}/>} 
                  onClick={async () => {
                    if(!teachAiQuestion.trim()) return;
                    setTeachingAi(true);
                    try {
                      await aiService.createKnowledge({
                        eventId: selectedRequest.eventId,
                        categoryId: selectedRequest.categoryId,
                        questionPattern: teachAiQuestion,
                        standardAnswer: teachAiModal.standardAnswer
                      });
                      setTeachAiModal({open: false, standardAnswer: ""});
                      setTeachAiQuestion("");
                      alert("AI has learned this response!");
                    } catch(e) {
                      alert("Failed to teach AI.");
                    } finally { setTeachingAi(false); }
                  }}>
                  Save to AI Memory
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <>
      <SectionHeader title="Consultation Requests" subtitle="Manage incoming requests from your teams" />

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative w-72" style={{ minWidth: 220 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or team name..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: search ? 36 : 14,
              paddingTop: 8, paddingBottom: 8, borderRadius: 10,
              border: `1px solid ${COLORS.border}`, background: "var(--surface-input, #f9f6f1)",
              color: COLORS.textPrimary, fontSize: 13, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={13} style={{ color: COLORS.textSecondary }} />
          <Select value={filterPriority || "none"} onValueChange={value => setFilterPriority(value === "none" ? "" : value as ConsultationPriority | "")}>
            <SelectTrigger style={selectStyle} className="outline-none">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} style={{ color: COLORS.textPrimary }}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <Select value={filterCategory || "none"} onValueChange={value => setFilterCategory(value === "none" ? "" : value)}>
            <SelectTrigger style={selectStyle} className="outline-none">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              {categoryOptions.map(o => <SelectItem key={o.id} value={o.id} style={{ color: COLORS.textPrimary }}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select value={filterStatus || "none"} onValueChange={value => setFilterStatus(value === "none" ? "" : value)}>
            <SelectTrigger style={selectStyle} className="outline-none">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} style={{ color: COLORS.textPrimary }}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {hasFilters && !loading && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
          Showing {filtered.length} of {requests.length} requests
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div style={{ color: COLORS.textSecondary, fontSize: 14, padding: "32px 0", textAlign: "center" }}>Loading requests...</div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare size={32} className="mx-auto mb-3" style={{ color: COLORS.border }} />
            <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
              {hasFilters ? "No requests match your filters." : "No consultation requests yet."}
            </div>
            {hasFilters && (
              <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>
                Clear all filters
              </button>
            )}
          </Card>
        ) : filtered.map(req => (
          <div key={req.id} onClick={() => openRequestDetail(req)}>
            <Card
              className="p-5 hover:bg-gray-50 cursor-pointer transition-colors"
              style={{ borderLeft: `3px solid ${PRIORITY_COLORS[req.priority]}` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }} className="truncate">{req.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }} className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>Team: <b>{req.teamName}</b></span>
                    <span style={{ color: PRIORITY_COLORS[req.priority], fontWeight: 600 }}>{req.priority}</span>
                    <span>{req.categoryName} · {req.eventName}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.lastMessagePreview && (
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" }} className="truncate">
                      "{req.lastMessagePreview}"
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {(req.unreadCount ?? 0) > 0 && (
                    <span style={{ background: COLORS.primary, color: "#fff", borderRadius: 9999, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
                      {req.unreadCount} new
                    </span>
                  )}
                  <StatusBadge status={getRequestBadgeStatus(req.status)} />
                  <Button variant="ghost" size="sm" icon={<MessageSquare size={13} />}>View</Button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
