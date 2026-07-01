import { useState, useEffect } from "react";
import { consultationService, ConsultationRequestResponse, ConsultationMessageResponse } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { MessageSquare, Send, CheckCircle, XCircle, PlayCircle, ArrowLeft } from "lucide-react";

type RequestAction = "ACCEPT" | "REJECT" | "IN_PROGRESS" | "RESOLVE";

const MESSAGEABLE_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS"];
const CLOSED_STATUSES = ["RESOLVED", "REJECTED", "CANCELLED"];

const getRequestBadgeStatus = (status: ConsultationRequestResponse["status"]) => {
  const badgeStatusMap: Record<ConsultationRequestResponse["status"], string> = {
    PENDING: "pending",
    ACCEPTED: "approved",
    IN_PROGRESS: "in_progress",
    RESOLVED: "completed",
    REJECTED: "rejected",
    CANCELLED: "closed",
  };

  return badgeStatusMap[status];
};

export function MentorConsultations({ onNavigate: _onNavigate }: { onNavigate?: (p: string) => void }) {
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequestResponse | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageResponse[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const page = await consultationService.getMentorRequests({ size: 50 });
      setRequests(page.content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openRequestDetail = async (req: ConsultationRequestResponse) => {
    setSelectedRequest(req);
    setMessages([]);
    setRejectReason("");
    setShowRejectInput(false);

    try {
      const msgs = await consultationService.getMessages(req.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const updateRequestState = (updatedRequest: ConsultationRequestResponse) => {
    setSelectedRequest(updatedRequest);
    setRequests(currentRequests =>
      currentRequests.map(req => (req.id === updatedRequest.id ? updatedRequest : req))
    );
  };

  const handleAction = async (action: RequestAction) => {
    if (!selectedRequest) return;

    try {
      let updatedRequest: ConsultationRequestResponse | null = null;

      if (action === "ACCEPT") {
        updatedRequest = await consultationService.acceptRequest(selectedRequest.id);
      } else if (action === "REJECT") {
        const reason = rejectReason.trim();
        if (!reason) return alert("Please provide a reason");
        updatedRequest = await consultationService.rejectRequest(selectedRequest.id, reason);
        setShowRejectInput(false);
        setRejectReason("");
      } else if (action === "IN_PROGRESS") {
        updatedRequest = await consultationService.markInProgress(selectedRequest.id);
      } else if (action === "RESOLVE") {
        updatedRequest = await consultationService.resolveRequest(selectedRequest.id);
      }

      if (updatedRequest) {
        updateRequestState(updatedRequest);
      }
    } catch (e) {
      console.error(e);
      alert("Action failed");
    }
  };

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !selectedRequest) return;

    try {
      const msg = await consultationService.sendMessage(selectedRequest.id, { content });
      setMessages(currentMessages => [...currentMessages, msg]);
      setMessageInput("");
    } catch (e) {
      console.error(e);
    }
  };

  if (selectedRequest) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setSelectedRequest(null)}>Back</Button>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{selectedRequest.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{selectedRequest.teamName} | {selectedRequest.categoryName}</div>
          </div>
          <StatusBadge status={getRequestBadgeStatus(selectedRequest.status)} />
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-2/3 flex flex-col bg-white rounded-xl border" style={{ borderColor: COLORS.border }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-xl mb-6" style={{ background: `${COLORS.primary}10` }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Description</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>{selectedRequest.description}</div>
              </div>

              {messages.map((m, i) => {
                const isMe = m.senderId === selectedRequest.mentorId;
                return (
                  <div key={m.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
                      {m.senderName} | {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="px-4 py-2 rounded-2xl max-w-[80%]" style={{
                      background: isMe ? COLORS.primary : COLORS.bg,
                      color: isMe ? "#fff" : COLORS.textPrimary,
                    }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {MESSAGEABLE_STATUSES.includes(selectedRequest.status) && (
              <div className="p-4 border-t flex gap-2" style={{ borderColor: COLORS.border }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-xl outline-none border"
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

          <div className="w-1/3 flex flex-col gap-4">
            <Card className="p-4">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Request Actions</div>
              <div className="space-y-2">
                {selectedRequest.status === "PENDING" && (
                  <>
                    <Button className="w-full justify-center" variant="primary" size="md" icon={<CheckCircle size={14} />} onClick={() => handleAction("ACCEPT")}>Accept Request</Button>
                    {!showRejectInput ? (
                      <Button className="w-full justify-center" variant="outline" size="md" icon={<XCircle size={14} />} onClick={() => setShowRejectInput(true)}>Reject</Button>
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
                  <Button className="w-full justify-center" variant="primary" size="md" icon={<PlayCircle size={14} />} onClick={() => handleAction("IN_PROGRESS")}>Mark In Progress</Button>
                )}
                {(selectedRequest.status === "ACCEPTED" || selectedRequest.status === "IN_PROGRESS") && (
                  <Button className="w-full justify-center" variant="outline" size="md" icon={<CheckCircle size={14} />} onClick={() => handleAction("RESOLVE")}>Resolve</Button>
                )}
                {CLOSED_STATUSES.includes(selectedRequest.status) && (
                  <div className="text-center text-sm text-gray-500 py-2">This request is closed.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Consultation Requests" subtitle="Manage incoming requests from your teams" />
      <div className="space-y-4">
        {loading ? <div>Loading requests...</div> : requests.length === 0 ? <div>No requests found.</div> : requests.map(req => (
          <div key={req.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openRequestDetail(req)}>
            <Card className="p-5 flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{req.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                  Team: {req.teamName} | Category: {req.categoryName} | Priority: {req.priority}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={getRequestBadgeStatus(req.status)} />
                <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />}>View</Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
