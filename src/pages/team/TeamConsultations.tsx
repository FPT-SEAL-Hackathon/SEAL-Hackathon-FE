import { useState, useEffect, useMemo } from "react";
import { consultationService, ConsultationRequestResponse, ConsultationMessageResponse, ConsultationPriority } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { MessageSquare, Send, ArrowLeft, XCircle, Search, SlidersHorizontal, X } from "lucide-react";

const PRIORITY_OPTIONS: { label: string; value: ConsultationPriority | "" }[] = [
  { label: "All Priorities", value: "" },
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
  { label: "All Statuses", value: "" },
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

export function TeamConsultations({ isLeader, onNavigate }: { isLeader: boolean; onNavigate?: (p: string) => void }) {
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
    return [{ id: "", label: "All Categories" }, ...Array.from(map.entries()).map(([id, label]) => ({ id, label }))];
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !r.mentorName.toLowerCase().includes(q)) return false;
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

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRequest) return;
    try {
      const msg = await consultationService.sendMessage(selectedRequest.id, { content: messageInput });
      setMessages([...messages, msg]);
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
              Mentor: {selectedRequest.mentorName}
              {" • "}
              <span style={{ fontWeight: 600, color: PRIORITY_COLORS[selectedRequest.priority] }}>
                {selectedRequest.priority}
              </span>
              {" • "}{selectedRequest.categoryName} ({selectedRequest.eventName})
            </div>
          </div>
          <StatusBadge status={selectedRequest.status.toLowerCase()} />
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col bg-white rounded-xl border" style={{ borderColor: COLORS.border }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-xl mb-6" style={{ background: `${COLORS.primary}10` }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Description</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>{selectedRequest.description}</div>
              </div>
              {messages.map((m, i) => {
                const isMentor = m.senderId === selectedRequest.mentorId;
                return (
                  <div key={i} className={`flex flex-col ${isMentor ? "items-start" : "items-end"}`}>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
                      {m.senderName} {isMentor ? "(Mentor)" : ""} • {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="px-4 py-2 rounded-2xl max-w-[80%] break-words" style={{
                      background: isMentor ? COLORS.bg : COLORS.primary,
                      color: isMentor ? COLORS.textPrimary : "#fff",
                    }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(selectedRequest.status) && (
              <div className="p-4 border-t flex gap-2" style={{ borderColor: COLORS.border }}>
                <input
                  type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-xl outline-none border"
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <Button variant="primary" size="md" icon={<Send size={14} />} onClick={sendMessage}>Send</Button>
              </div>
            )}

            {["RESOLVED", "REJECTED", "CANCELLED"].includes(selectedRequest.status) && (
              <div className="p-3 border-t text-center text-sm text-gray-500" style={{ borderColor: COLORS.border }}>
                This request is closed.
              </div>
            )}
          </div>

          {isLeader && selectedRequest.status === "PENDING" && (
            <div className="w-64">
              <Card className="p-4">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Actions</div>
                <Button className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50" variant="outline" size="sm" icon={<XCircle size={14} />} onClick={cancelRequest}>
                  Cancel Request
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────
  return (
    <>
      <SectionHeader
        title="Consultation Requests"
        subtitle="Your team's consultation history with the mentor"
        action={<Button variant="outline" size="sm" onClick={() => onNavigate?.("team")}>Back to Team</Button>}
      />

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or mentor name..."
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
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as ConsultationPriority | "")} style={selectStyle}>
            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Category / Event filter */}
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
          {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

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
                    <span>Mentor: <b>{req.mentorName}</b></span>
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
