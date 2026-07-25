import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, GitBranch, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { eventService } from "@/features/events/api/eventService";
import { parseApiError } from "@/lib/api/apiClient";
import {
  formatSyncStatus,
  submissionService,
  type EventSubmissionRepositoryItem,
} from "@/features/submissions/api/submissionService";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Trang thai hien thi tren bang: gop "khong co repository" vao chung mot truc filter
// voi cac sync status cua backend.
function displayStatus(item: EventSubmissionRepositoryItem): string {
  if (!item.repository) return item.repositoryUrl ? "NOT_SYNCHRONIZED" : "MISSING";
  return item.repository.lastSyncStatus || "NOT_SYNCHRONIZED";
}

function statusClass(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "text-green-600";
    case "FAILED":
      return "text-red-600";
    case "MISSING":
      return "text-amber-600";
    default:
      return "text-gray-500";
  }
}

/**
 * Organizer (event creator) overview: repository metadata cua moi submission trong event.
 * Nguon du lieu chinh la bang SubmissionRepositories (backend da check quyen creator-only).
 */
export function AdminSubmissionRepositoriesView() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [items, setItems] = useState<EventSubmissionRepositoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  // Filters
  const [teamFilter, setTeamFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    eventService.getAll(true).then(res => {
      setEvents(res);
      if (res.length > 0) setSelectedEventId(res[0].eventId);
    }).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (selectedEventId) void loadItems(selectedEventId);
  }, [selectedEventId]);

  const loadItems = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await submissionService.getEventSubmissionRepositories(eventId);
      setItems(data);
    } catch (error) {
      toast.error(parseApiError(error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResync = async (item: EventSubmissionRepositoryItem) => {
    setSyncing(prev => ({ ...prev, [item.submissionId]: true }));
    try {
      const repo = await submissionService.syncSubmissionRepository(item.submissionId);
      setItems(prev => prev.map(existing =>
        existing.submissionId === item.submissionId ? { ...existing, repository: repo } : existing));
      toast.success("Repository metadata synchronized.");
    } catch (error) {
      const parsed = parseApiError(error);
      // 409 = mot phien sync khac dang chay; cac loi khac hien message an toan tu backend.
      toast.error(parsed.message);
      // Sync co the da luu trang thai FAILED — reload de hien error code moi nhat.
      if (selectedEventId) void loadItems(selectedEventId);
    } finally {
      setSyncing(prev => ({ ...prev, [item.submissionId]: false }));
    }
  };

  const handleExport = async () => {
    if (!selectedEventId) return;
    setExporting(true);
    try {
      const blob = await submissionService.exportEventSubmissionRepositoriesCsv(selectedEventId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `submission-repositories-${selectedEventId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setExporting(false);
    }
  };

  const rounds = useMemo(() => Array.from(new Set(items.map(i => i.roundName).filter(Boolean))) as string[], [items]);
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.categoryName).filter(Boolean))) as string[], [items]);
  const languages = useMemo(
    () => Array.from(new Set(items.map(i => i.repository?.primaryLanguage).filter(Boolean))) as string[],
    [items]);
  const statuses = ["SUCCESS", "FAILED", "RUNNING", "NOT_SYNCHRONIZED", "MISSING"];

  const filtered = items.filter(item => {
    if (teamFilter && !(item.teamName ?? "").toLowerCase().includes(teamFilter.toLowerCase())) return false;
    if (roundFilter && item.roundName !== roundFilter) return false;
    if (categoryFilter && item.categoryName !== categoryFilter) return false;
    if (languageFilter && item.repository?.primaryLanguage !== languageFilter) return false;
    if (statusFilter && displayStatus(item) !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch size={18} /> Submission Repositories
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-md px-2 py-1.5 text-sm"
              value={selectedEventId}
              onChange={event => setSelectedEventId(event.target.value)}
            >
              {events.map(item => (
                <option key={item.eventId} value={item.eventId}>{item.eventName}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => selectedEventId && loadItems(selectedEventId)} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || !selectedEventId}>
              <Download size={14} className="mr-1" /> {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Filter by team..."
              value={teamFilter}
              onChange={event => setTeamFilter(event.target.value)}
              className="w-44"
            />
            <select className="border rounded-md px-2 py-1.5 text-sm" value={roundFilter} onChange={e => setRoundFilter(e.target.value)}>
              <option value="">All rounds</option>
              {rounds.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1.5 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1.5 text-sm" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
              <option value="">All languages</option>
              {languages.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <select className="border rounded-md px-2 py-1.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map(name => <option key={name} value={name}>{formatSyncStatus(name)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading submission repositories...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No submission repositories found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Team</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Round</th>
                    <th className="py-2 pr-3">Repository</th>
                    <th className="py-2 pr-3">Language</th>
                    <th className="py-2 pr-3">Branch</th>
                    <th className="py-2 pr-3">Last pushed</th>
                    <th className="py-2 pr-3">Last synced</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const repo = item.repository;
                    const status = displayStatus(item);
                    const link = repo?.externalUrl || repo?.repositoryUrl || item.repositoryUrl;
                    return (
                      <tr key={item.submissionId} className="border-b align-top">
                        <td className="py-2 pr-3 font-medium">
                          {item.sampleSubmission ? (
                            /* Bài mẫu calibration không thuộc đội thi nào → gắn nhãn thay vì "—". */
                            <span className="inline-flex items-center rounded bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[11px] font-semibold">
                              Sample (Calibration)
                            </span>
                          ) : (item.teamName ?? "—")}
                        </td>
                        <td className="py-2 pr-3">{item.categoryName ?? "—"}</td>
                        <td className="py-2 pr-3">{item.roundName ?? "—"}</td>
                        <td className="py-2 pr-3 max-w-[240px]">
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all inline-flex items-center gap-1">
                              {repo?.fullName || link}
                              <ExternalLink size={12} />
                            </a>
                          ) : "—"}
                          {item.lastPushAfterDeadline === true && (
                            /* Chi bao trung lap de review thu cong, KHONG phai ket luan vi pham. */
                            <div className="mt-1 text-[11px] text-amber-600 inline-flex items-center gap-1">
                              <AlertCircle size={11} /> Last push occurred after submission deadline
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3">{repo?.primaryLanguage ?? "—"}</td>
                        <td className="py-2 pr-3">{repo?.defaultBranch ?? "—"}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(repo?.lastPushedAt)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(repo?.lastSynchronizedAt)}</td>
                        <td className="py-2 pr-3">
                          <span className={`text-xs font-semibold ${statusClass(status)}`}>{formatSyncStatus(status)}</span>
                          {repo?.errorCode && status === "FAILED" && (
                            <div className="text-[11px] text-red-500 mt-0.5" title={repo.errorMessage}>{repo.errorCode}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {item.repositoryUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResync(item)}
                              disabled={!!syncing[item.submissionId]}
                            >
                              <RefreshCw size={13} className={syncing[item.submissionId] ? "animate-spin" : ""} />
                              <span className="ml-1">{syncing[item.submissionId] ? "Syncing..." : "Resync"}</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
