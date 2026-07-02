import { useState, useEffect } from "react";
import { consultationService, ConsultationRequestResponse, ConsultationMessageResponse } from "@/features/consultation/api/consultationService";
import { SectionHeader, Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { MessageSquare, Send, ArrowLeft, XCircle } from "lucide-react";

export function TeamConsultations({ isLeader }: { isLeader: boolean }) {
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequestResponse | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageResponse[]>([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const page = await consultationService.getMyTeamRequests({ size: 50 });
      setRequests(page.content);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openRequestDetail = async (req: ConsultationRequestResponse) => {
    setSelectedRequest(req);
    try {
      const msgs = await consultationService.getMessages(req.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedRequest) return;
    try {
      const msg = await consultationService.sendMessage(selectedRequest.id, { content: messageInput });
      setMessages([...messages, msg]);
      setMessageInput("");
    } catch (e) {
      console.error(e);
    }
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

  if (selectedRequest) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setSelectedRequest(null)}>Back</Button>
          <div className="flex-1">
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{selectedRequest.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Mentor: {selectedRequest.mentorName} • Priority: {selectedRequest.priority}</div>
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
                // If it's a mentor, it's NOT me.
                const isMentor = m.senderId === selectedRequest.mentorId;
                
                return (
                  <div key={i} className={`flex flex-col ${isMentor ? 'items-start' : 'items-end'}`}>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
                      {m.senderName} {isMentor ? '(Mentor)' : ''} • {new Date(m.createdAt).toLocaleString()}
                    </div>
                    <div className="px-4 py-2 rounded-2xl max-w-[80%]" style={{
                      background: isMentor ? COLORS.bg : COLORS.primary,
                      color: isMentor ? COLORS.textPrimary : '#fff',
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
                  type="text" 
                  value={messageInput} 
                  onChange={e => setMessageInput(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 px-4 py-2 rounded-xl outline-none border" 
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
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

  return (
    <>
      <SectionHeader title="Consultation Requests" subtitle="Your team's consultation history with the mentor" />
      <div className="space-y-4">
        {loading ? <div>Loading requests...</div> : requests.length === 0 ? <div>No requests found.</div> : requests.map(req => (
          <div key={req.id} onClick={() => openRequestDetail(req)}>
            <Card className="p-5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{req.title}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                  Mentor: {req.mentorName} • Priority: {req.priority}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={req.status.toLowerCase()} />
                <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />}>View</Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
