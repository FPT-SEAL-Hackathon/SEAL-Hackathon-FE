import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Upload, Shield, AlertTriangle, Calendar, BookOpen,
  GitBranch, Star, UserCheck, Trophy, BarChart2, Bell,
  Settings, PlusCircle, Edit, Trash2, Save, CheckCircle,
  TrendingUp, Clock, Activity, Download, Send, Search, Filter,
  Eye, ToggleLeft, ToggleRight, X, Zap, Award, Loader, Database
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, DataTable, TimelineItem
} from "@/components/shared/UIComponents";
import { useState, useEffect } from "react";
import { judgingService, EvaluationAuditLogDTO } from "@/features/judging/api/judgingService";

interface AdminViewProps {
  context: any;
}

export function AdminAuditView({ context }: AdminViewProps) {
  const {
    t,
    selectedEventId: globalSelectedEventId,
  } = context;

  const [localEventId, setLocalEventId] = useState(globalSelectedEventId);
  const [localLogs, setLocalLogs] = useState<EvaluationAuditLogDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<EvaluationAuditLogDTO | null>(null);
  
  const [eventSearchText, setEventSearchText] = useState("");
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  useEffect(() => {
    setLocalEventId(globalSelectedEventId);
  }, [globalSelectedEventId]);

  useEffect(() => {
    if (!localEventId) {
      setEventSearchText("");
      return;
    }
    const evt = context.apiEvents?.find((e: any) => (e.eventId || e.id) === localEventId);
    if (evt) setEventSearchText(evt.eventName || evt.name);
  }, [localEventId, context.apiEvents]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!localEventId) {
        setLocalLogs([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await judgingService.getAuditLogs(localEventId);
        setLocalLogs(res);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [localEventId]);

  const uniqueActions = ["ALL", ...Array.from(new Set(localLogs.map(l => l.actionType)))];

  const getUserName = (id?: string) => {
    if (!id) return null;
    const user = context.apiUsers?.find((u: any) => String(u.id) === id || u.userId === id);
    return user?.fullName || user?.name || null;
  };

  const getTeamName = (id?: string) => {
    if (!id) return null;
    const team = context.apiTeamEligibility?.find((t: any) => t.teamId === id);
    return team?.teamName || null;
  };

  const filteredLogs = localLogs.filter(log => {
    const matchesAction = actionFilter === "ALL" || log.actionType === actionFilter;
    const q = searchTerm.toLowerCase();
    
    const actorName = log.actorName || getUserName(log.actorUserId) || "";
    const teamName = log.teamName || getTeamName(log.teamId) || "";

    const matchesSearch = !searchTerm || 
      (log.reason && log.reason.toLowerCase().includes(q)) ||
      (log.actorUserId && log.actorUserId.toLowerCase().includes(q)) ||
      (actorName.toLowerCase().includes(q)) ||
      (log.submissionId && log.submissionId.toLowerCase().includes(q)) ||
      (log.teamId && log.teamId.toLowerCase().includes(q)) ||
      (teamName.toLowerCase().includes(q)) ||
      (log.judgingId && log.judgingId.toLowerCase().includes(q));
    return matchesAction && matchesSearch;
  });

  return (
    <>
      <SectionHeader title={t("admin.auditLogs")} subtitle={t("admin.auditSubtitle")} action={<Button variant="outline" size="sm" icon={<Download size={14} />}>{t("common.exportLogs")}</Button>} />
      
      {/* EVENT SELECTOR & FILTER BAR */}
      <Card className="mb-6" style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative" style={{ zIndex: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Event..."
                value={eventSearchText}
                onChange={e => {
                  setEventSearchText(e.target.value);
                  setShowEventDropdown(true);
                  if (e.target.value === "") setLocalEventId("");
                }}
                onFocus={() => setShowEventDropdown(true)}
                onBlur={() => setTimeout(() => setShowEventDropdown(false), 200)}
                className="w-full px-3 py-2 pl-9 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            {showEventDropdown && (
              <div 
                className="absolute w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto"
                style={{ borderColor: COLORS.border }}
              >
                {context.apiEvents && context.apiEvents
                  .filter((evt: any) => (evt.eventName || evt.name).toLowerCase().includes(eventSearchText.toLowerCase()))
                  .map((evt: any) => (
                    <div
                      key={evt.eventId || evt.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                      style={{ fontSize: 14 }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setLocalEventId(evt.eventId || evt.id);
                        setEventSearchText(evt.eventName || evt.name);
                        setShowEventDropdown(false);
                      }}
                    >
                      {evt.eventName || evt.name}
                    </div>
                ))}
                {(!context.apiEvents || context.apiEvents.filter((evt: any) => (evt.eventName || evt.name).toLowerCase().includes(eventSearchText.toLowerCase())).length === 0) && (
                  <div className="px-4 py-2 text-gray-500" style={{ fontSize: 14 }}>No events found</div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>SEARCH</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Reason, User Name, User ID, Team ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                style={{ fontSize: 14, borderColor: COLORS.border, background: "white" }}
              />
            </div>
          </div>
          
          <div className="w-full md:w-64 relative">
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ACTION</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Select value={actionFilter || "none"} onValueChange={value => setActionFilter((value === "none" ? "" : value))}>
                <SelectTrigger
                  className="w-full py-2 pl-10 pr-3 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action} style={{ color: COLORS.textPrimary }}>{action === "ALL" ? "All Actions" : action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center flex-col gap-3">
            <Loader size={32} className="animate-spin text-primary" />
            <p className="text-sm text-gray-500">Loading audit logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Action", "Actor (User ID)", "Target", "Details", "Timestamp", "View"].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? filteredLogs.map((log: EvaluationAuditLogDTO, i: number) => {
                  const actorName = log.actorName || getUserName(log.actorUserId);
                  const teamName = log.teamName || getTeamName(log.teamId);
                  
                  return (
                  <tr 
                    key={log.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                    style={{ borderBottom: i < filteredLogs.length - 1 ? `1px solid ${COLORS.border}` : "none" }}
                  >
                    <td className="px-4 py-3"><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{log.actionType}</span></td>
                    <td className="px-4 py-3">
                      {actorName && <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary, display: "block" }}>{actorName}</span>}
                      <span style={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: "monospace" }}>{log.actorUserId.substring(0, 13)}...</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {log.teamId && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#f3f4f6", color: "#4b5563", width: "max-content" }}>Team: {teamName || log.teamId.substring(0, 8) + "..."}</span>}
                        {log.submissionId && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#e0e7ff", color: "#3730a3", width: "max-content" }}>Sub: {log.submissionId.substring(0, 8)}...</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{log.reason}</span>
                        {log.oldValue && log.newValue && (
                          <span style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
                            {log.oldValue} ➔ {log.newValue}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span style={{ fontSize: 12, color: COLORS.textSecondary }}>{new Date(log.createdAt).toLocaleString()}</span></td>
                    <td className="px-4 py-3"><Eye size={16} className="text-gray-400" /></td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {!localEventId ? "Please select an event to view audit logs." : "No logs found matching criteria."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* VIEW DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-xl" style={{ maxHeight: '90vh' }}>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>Audit Log Details</h3>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>ACTION</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{selectedLog.actionType}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>ACTOR (USER ID)</div>
                  {(selectedLog.actorName || getUserName(selectedLog.actorUserId)) && <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>{selectedLog.actorName || getUserName(selectedLog.actorUserId)}</div>}
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'monospace' }}>{selectedLog.actorUserId}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>TARGET ENTITIES</div>
                <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border">
                  {selectedLog.judgingId && <div style={{ fontSize: 13, color: COLORS.textPrimary }}><strong>Judging ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedLog.judgingId}</span></div>}
                  {selectedLog.teamId && (
                    <div style={{ fontSize: 13, color: COLORS.textPrimary }}>
                      <strong>Team:</strong> {(selectedLog.teamName || getTeamName(selectedLog.teamId)) ? <span className="font-semibold mr-1">{selectedLog.teamName || getTeamName(selectedLog.teamId)}</span> : null}
                      <span style={{ fontFamily: 'monospace', color: COLORS.textSecondary }}>({selectedLog.teamId})</span>
                    </div>
                  )}
                  {selectedLog.submissionId && <div style={{ fontSize: 13, color: COLORS.textPrimary }}><strong>Submission ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedLog.submissionId}</span></div>}
                  {!selectedLog.judgingId && !selectedLog.teamId && !selectedLog.submissionId && <span className="text-gray-400 italic">No targets associated</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>REASON / DETAILS</div>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100" style={{ fontSize: 14 }}>
                  {selectedLog.reason || <span className="text-blue-300 italic">No reason provided</span>}
                </div>
              </div>

              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>PREVIOUS VALUE</div>
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 h-full font-mono text-xs whitespace-pre-wrap">
                      {selectedLog.oldValue || <span className="text-red-300 italic">None</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>NEW VALUE</div>
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 h-full font-mono text-xs whitespace-pre-wrap">
                      {selectedLog.newValue || <span className="text-green-300 italic">None</span>}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>LOG ID</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'monospace' }}>{selectedLog.id}</div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
