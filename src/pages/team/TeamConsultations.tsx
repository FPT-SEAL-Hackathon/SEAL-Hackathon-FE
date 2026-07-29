import { useState, useEffect, useMemo } from "react";
import { consultationService, ConsultationRequestResponse, ConsultationMessageResponse, ConsultationPriority } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, ArrowLeft, XCircle, Search, SlidersHorizontal, X, BrainCircuit, Sparkles, Bot } from "lucide-react";
import { useAuth } from "@/features/auth/store/authStore";

const PRIORITY_OPTIONS: { label: string; value: ConsultationPriority | "none" }[] = [
  { label: "All Priorities", value: "none" },
  { label: "🔴 Urgent", value: "URGENT" },
  { label: "🟠 High", value: "HIGH" },
  { label: "🟡 Medium", value: "MEDIUM" },
  { label: "🟢 Low", value: "LOW" },
];

const PRIORITY_COLORS: Record<ConsultationPriority, string> = {
  URGENT: "#e53e2e",
  HIGH:   "#f47920",
  MEDIUM: "#d4a017",
  LOW:    "#009444",
};

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "none" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const selectStyle: React.CSSProperties = {
  background: "var(--surface-input, #f9f6f1)",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
  borderRadius: 10,
  padding: "7px 12px",
  fontSize: 13,
  outline: "none",
  cursor: "pointer",
  minWidth: 140,
};

import { milestoneService, type MilestoneResponse } from "@/features/teams/api/milestoneService";
import { MentorProfileResponse } from "@/features/consultation/api/consultationService";
import { Target, FileText, Circle, CheckCircle, PlusCircle, Loader, Users } from "lucide-react";

// ─── Milestone panel ───────────────────────────────────────────────────────────
function MilestonePanel({ requestId, onToggle }: { requestId: string; onToggle?: () => void }) {
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    milestoneService.getByTeam(requestId)
      .then(setMilestones)
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, [requestId]);

  const doneCount = milestones.filter(m => m.isDone).length;

  const handleToggle = async (milestoneId: string) => {
    try {
      const updated = await milestoneService.toggle(requestId, milestoneId);
      setMilestones(prev => prev.map(m => m.milestoneId === milestoneId ? updated : m));
      onToggle?.();
    } catch (e: any) {
      console.error("Failed to toggle milestone", e);
    }
  };

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
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors cursor-pointer hover:bg-gray-50"
            style={{ background: m.isDone ? `${COLORS.success}08` : COLORS.bg, border: `1px solid ${m.isDone ? COLORS.success + "40" : COLORS.border}` }}
            onClick={() => handleToggle(m.milestoneId)}
          >
            <div style={{ flexShrink: 0, lineHeight: 0 }}>
              {m.isDone
                ? <CheckCircle size={15} style={{ color: COLORS.success }} />
                : <Circle size={15} style={{ color: COLORS.border }} />
              }
            </div>
            <span className="flex-1 break-words min-w-0" style={{
              fontSize: 13, color: m.isDone ? COLORS.textSecondary : COLORS.textPrimary,
              textDecoration: m.isDone ? "line-through" : "none"
            }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mentor Notes Panel (Team view - read only) ────────────────────────────────
function MentorNotesPanel({ requestId }: { requestId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    consultationService.getMyTeamMentorNotes(requestId)
      .then(res => setNotes(res.filter(n => n.note?.trim())))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [requestId]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} style={{ color: COLORS.primary }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>Expert Notes</span>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2" style={{ color: COLORS.textSecondary, fontSize: 12 }}>
            <Loader size={12} className="animate-spin" /> Loading...
          </div>
        ) : notes.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontStyle: "italic" }}>No notes added yet.</div>
        ) : notes.map((n, i) => (
          <div key={i} className="p-3 rounded-lg border" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
            <div style={{ fontSize: 13, color: COLORS.textPrimary, whiteSpace: "pre-wrap" }}>{n.note}</div>
          </div>
        ))}
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

export function TeamConsultations({ isLeader, onNavigate, hideHeader }: { isLeader: boolean; onNavigate?: (p: string) => void; hideHeader?: boolean }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequestResponse | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageResponse[]>([]);
  const [messageInput, setMessageInput] = useState("");

  // ── Filters ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<ConsultationPriority | "">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const page = await consultationService.getMyTeamRequests({ size: 100 });
      setRequests(page.content);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Derived lists for filter dropdowns
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach(r => { if (r.categoryId) map.set(r.categoryId, `${r.eventName} — ${r.categoryName}`); });
    return [{ id: "none", label: "All Categories" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))];
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
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
    try {
      const msgs = await consultationService.getMessages(req.id);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const reloadMessages = async () => {
    if (!selectedRequest) return;
    try {
      const msgs = await consultationService.getMessages(selectedRequest.id);
      setMessages(msgs);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRequest) return;
    try {
      await consultationService.sendMessage(selectedRequest.id, { content: messageInput });
      await reloadMessages();
      setMessageInput("");
    } catch (e) { console.error(e); }
  };

  const cancelRequest = async () => {
    if (!selectedRequest || !isLeader || selectedRequest.status !== "PENDING") return;
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      const res = await consultationService.cancelRequest(selectedRequest.id);
      setSelectedRequest(res);
      loadRequests();
    } catch (e) {
      console.error(e);
      alert("Failed to cancel request");
    }
  };

  // ── Detail view ────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setSelectedRequest(null)}>Back</Button>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{selectedRequest.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>

              <span style={{ fontWeight: 600, color: PRIORITY_COLORS[selectedRequest.priority] }}>
                {selectedRequest.priority}
              </span>
              {" • "}{selectedRequest.categoryName} ({selectedRequest.eventName})
            </div>
          </div>
          <StatusBadge status={selectedRequest.status.toLowerCase()} />
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Chat Panel */}
          <div className="w-2/3 flex flex-col bg-white rounded-xl border" style={{ borderColor: COLORS.border, minWidth: 0 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-xl mb-6" style={{ background: `${COLORS.primary}10` }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Description</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>{selectedRequest.description}</div>
              </div>
              {messages.map((m, i) => {
                const isAi = m.content?.startsWith("[AI Mentor]") || m.senderName === "null" || !m.senderId;
                const isMentor = !isAi && m.senderId !== user?.userId;
                const isMe = !isAi && !isMentor;

                if (isAi) {
                  return (
                    <div key={i} className="flex flex-col items-start my-2">
                      <div style={{ fontSize: 11, marginBottom: 4 }} className="flex items-center gap-1.5 font-semibold text-purple-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                          <Sparkles size={11} className="text-purple-600 animate-pulse" /> AI Assistant
                        </span>
                        <span style={{ fontSize: 11, color: COLORS.textSecondary }}>• {new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <div
                        className="px-4 py-3 rounded-2xl max-w-[85%] break-words whitespace-pre-wrap shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                          color: "#3b0764",
                          border: "1px solid #c084fc",
                          borderLeft: "4px solid #8b5cf6",
                        }}
                      >
                        {m.content?.replace("[AI Mentor]: ", "")}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"} my-1`}>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }} className="flex items-center gap-1">
                      <span className="font-semibold">{m.senderName}</span> {isMentor ? "(Mentor)" : "(Leader)"} • {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl max-w-[80%] break-words whitespace-pre-wrap shadow-sm" style={{
                      background: isMe ? COLORS.primary : (isMentor ? "#f0fdf4" : "#ffffff"),
                      color: isMe ? "#ffffff" : COLORS.textPrimary,
                      border: isMe ? "none" : (isMentor ? "1px solid #86efac" : `1px solid ${COLORS.border}`),
                    }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {["ACCEPTED", "IN_PROGRESS"].includes(selectedRequest.status) && (
              <div className="p-4 border-t flex gap-2" style={{ borderColor: COLORS.border }}>
                <input
                  type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl outline-none border"
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <Button variant="primary" size="md" icon={<Send size={14} />} onClick={sendMessage}>Send</Button>
              </div>
            )}

            {selectedRequest.status === "PENDING" && (
              <div className="p-3 border-t text-center text-sm font-medium" style={{ borderColor: COLORS.border, background: `${COLORS.warning}10`, color: "#b45309" }}>
                ⏳ Waiting for an expert to accept this request before messaging.
              </div>
            )}

            {["RESOLVED", "REJECTED", "CANCELLED"].includes(selectedRequest.status) && (
              <div className="p-3 border-t text-center text-sm text-gray-500" style={{ borderColor: COLORS.border }}>
                This request is closed.
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-1/3 flex flex-col gap-4 overflow-y-auto min-w-0 pr-1 pb-4">
            {isLeader && selectedRequest.status === "PENDING" && (
              <Card className="p-4 flex-shrink-0">
                <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 12 }}>Actions</div>
                <Button className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50" variant="outline" size="sm" icon={<XCircle size={14} />} onClick={cancelRequest}>
                  Cancel Request
                </Button>
              </Card>
            )}
            
            <Card className="p-4 flex-shrink-0">
              <MentorsInRoomPanel categoryId={selectedRequest.categoryId} />
            </Card>

            <Card className="p-4 flex-shrink-0">
              <MilestonePanel requestId={selectedRequest.id} onToggle={reloadMessages} />
            </Card>

            <Card className="p-4 flex-shrink-0">
              <MentorNotesPanel requestId={selectedRequest.id} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────
  return (
    <>
      {!hideHeader && (
        <SectionHeader
          title="Consultation Requests"
          subtitle="Your team's consultation history with the mentor"
          action={<Button variant="outline" size="sm" onClick={() => onNavigate?.("team")}>Back to Team</Button>}
        />
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Search */}
        <div className="relative w-72" style={{ minWidth: 220 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title..."
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: search ? 36 : 14,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: "var(--surface-input, #f9f6f1)",
              color: COLORS.textPrimary,
              fontSize: 13,
              outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Priority filter */}
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

        {/* Category / Event filter */}
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

        {/* Status filter */}
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

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {hasFilters && !loading && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
          Showing {filtered.length} of {requests.length} requests
        </div>
      )}

      {/* List */}
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
            <Card className="p-5 hover:bg-gray-50 cursor-pointer transition-colors" style={{ borderLeft: `3px solid ${PRIORITY_COLORS[req.priority]}` }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }} className="truncate">{req.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }} className="flex flex-wrap gap-x-3 gap-y-1">

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
                  <StatusBadge status={req.status.toLowerCase()} />
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
