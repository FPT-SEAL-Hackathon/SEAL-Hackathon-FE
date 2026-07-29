import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, SectionHeader, StatusBadge, Button, DataTable, COLORS } from "@/components/shared/UIComponents";
import { appealService, type Appeal } from "@/features/appeals/api/appealService";
import { Loader, MessageSquare, Check, X } from "lucide-react";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { parseApiError } from "@/lib/api/apiClient";

export function AdminAppealsView() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"RESOLVED" | "REJECTED">("RESOLVED");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    eventService.getAll(true).then(res => {
      setEvents(res);
      if (res.length > 0) {
        setSelectedEventId(res[0].eventId);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAppeals(selectedEventId);
    }
  }, [selectedEventId]);

  const loadAppeals = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await appealService.getAppealsByEvent(eventId);
      setAppeals(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load appeals");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (appealId: string) => {
    if (!resolutionNote.trim()) {
      toast.error("Please provide a resolution note.");
      return;
    }
    setResolving(true);
    try {
      await appealService.resolveAppeal(appealId, {
        status: resolutionStatus,
        resolutionNote
      });
      toast.success("Appeal resolved successfully");
      setResolvingId(null);
      setResolutionNote("");
      loadAppeals(selectedEventId);
    } catch (error: any) {
      console.error(error);
      toast.error(parseApiError(error).message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Appeals Management" 
        subtitle="Review and resolve team complaints regarding scores or issues."
        action={
          <Select value={selectedEventId || "none"} onValueChange={(value) => setSelectedEventId((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {events.map(ev => (
              <SelectItem key={ev.eventId} value={ev.eventId} style={{ color: COLORS.textPrimary }}>{ev.eventName}</SelectItem>
            ))}
  </SelectContent>
</Select>
        }
      />

      {loading ? (
        <div className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>
      ) : appeals.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center text-gray-500">
          <MessageSquare size={40} className="mb-3 opacity-20" />
          <p>No appeals found for this event.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appeals.map(appeal => (
            <Card key={appeal.appealId} className="p-5 border-l-4" style={{ borderLeftColor: appeal.status === 'PENDING' ? '#F59E0B' : appeal.status === 'RESOLVED' ? '#10B981' : '#EF4444' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg">{appeal.title}</h4>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                      {appeal.appealType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3">
                    <span>Team: <span className="font-semibold text-gray-700">{appeal.teamName}</span></span>
                    <span>Category: <span className="font-semibold text-gray-700">{appeal.categoryName}</span></span>
                  </div>
                </div>
                <StatusBadge status={appeal.status.toLowerCase()} />
              </div>
              
              <div className="p-3 bg-gray-50 rounded mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                {appeal.reason}
              </div>

              {appeal.status === 'PENDING' && (
                <div className="mt-4 pt-4 border-t">
                  {resolvingId === appeal.appealId ? (
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status-${appeal.appealId}`} checked={resolutionStatus === 'RESOLVED'} onChange={() => setResolutionStatus('RESOLVED')} />
                          <span className="text-sm font-medium text-green-600">Resolve (Approve)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`status-${appeal.appealId}`} checked={resolutionStatus === 'REJECTED'} onChange={() => setResolutionStatus('REJECTED')} />
                          <span className="text-sm font-medium text-red-600">Reject</span>
                        </label>
                      </div>
                      <textarea 
                        className="w-full p-2 border rounded min-h-[80px] text-sm"
                        placeholder="Resolution Note (Reason for approval/rejection)..."
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setResolvingId(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => handleResolve(appeal.appealId)} disabled={resolving} icon={resolving && <Loader className="animate-spin" size={14} />}>
                          Submit Resolution
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" icon={<Check size={14} />} onClick={() => { setResolvingId(appeal.appealId); setResolutionStatus('RESOLVED'); setResolutionNote(""); }}>
                        Process Appeal
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {appeal.status !== 'PENDING' && appeal.resolutionNote && (
                <div className="mt-4 pt-4 border-t text-sm">
                  <span className="font-semibold text-gray-600">Resolution Note:</span>
                  <p className="mt-1 text-gray-800 whitespace-pre-wrap">{appeal.resolutionNote}</p>
                  <div className="mt-2 text-xs text-gray-400 flex justify-between">
                    <span>Resolved By: {appeal.resolvedByName}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
