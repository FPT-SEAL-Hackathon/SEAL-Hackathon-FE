import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, GitBranch, RefreshCw, AlertTriangle, Star, GitFork, CircleDot, GitCommit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Trang thai hien thi tren bang
function displayStatus(item: EventSubmissionRepositoryItem): string {
  if (!item.repository) return item.repositoryUrl ? "NOT_SYNCHRONIZED" : "MISSING";
  return item.repository.lastSyncStatus || "NOT_SYNCHRONIZED";
}

interface StatusBadgeProps { status: string }
function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    SUCCESS:         { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: formatSyncStatus("SUCCESS") },
    FAILED:          { bg: "bg-red-50 border-red-200",         text: "text-red-700",     dot: "bg-red-500",     label: formatSyncStatus("FAILED") },
    RUNNING:         { bg: "bg-blue-50 border-blue-200",       text: "text-blue-700",    dot: "bg-blue-500",    label: formatSyncStatus("RUNNING") },
    NOT_SYNCHRONIZED:{ bg: "bg-gray-50 border-gray-200",       text: "text-gray-600",    dot: "bg-gray-400",    label: formatSyncStatus("NOT_SYNCHRONIZED") },
    MISSING:         { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-500",   label: "Missing URL" },
  };
  const c = config[status] ?? config.NOT_SYNCHRONIZED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/**
 * Organizer overview: repository metadata của mọi submission trong event.
 */
export function AdminSubmissionRepositoriesView() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [items, setItems] = useState<EventSubmissionRepositoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [teamFilter, setTeamFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    // Khong auto-chon event: mac dinh "" = hien HET repo cua moi event Organizer to chuc.
    eventService.getAll(true).then(res => setEvents(res)).catch(() => setEvents([]));
  }, []);

  // Khong chon event = gop tat ca event; chon 1 event = chi event do.
  useEffect(() => {
    if (events.length > 0) void reload();
  }, [selectedEventId, events]);

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

  // Gop repo cua TAT CA event Organizer to chuc (moi event mot call, loi tung event bo qua).
  const loadAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        events.map(ev =>
          submissionService.getEventSubmissionRepositories(ev.eventId).catch(() => [] as EventSubmissionRepositoryItem[])
        )
      );
      setItems(results.flat());
    } catch (error) {
      toast.error(parseApiError(error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const reload = () => (selectedEventId ? loadItems(selectedEventId) : loadAll());

  // Resync HET cac dong DANG LOC bang 1 nut: tuan tu (ton trong rate-limit + khoa RUNNING),
  // cap nhat tung dong khi xong, tong ket ok/fail cuoi cung.
  const handleBulkResync = async () => {
    const targets = filtered.filter(i => i.repositoryUrl);
    if (targets.length === 0) return;
    setBulkSyncing(true);
    let ok = 0;
    let fail = 0;
    for (const item of targets) {
      try {
        const repo = await submissionService.syncSubmissionRepository(item.submissionId);
        setItems(prev => prev.map(existing =>
          existing.submissionId === item.submissionId ? { ...existing, repository: repo } : existing));
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkSyncing(false);
    if (fail > 0) toast.warning(`Resynced ${ok}/${targets.length}, ${fail} failed.`);
    else toast.success(`Resynced ${ok}/${targets.length}.`);
    if (fail > 0) void reload();
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

  const rounds     = useMemo(() => Array.from(new Set(items.map(i => i.roundName).filter(Boolean))) as string[], [items]);
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.categoryName).filter(Boolean))) as string[], [items]);
  const languages  = useMemo(() => Array.from(new Set(items.map(i => i.repository?.primaryLanguage).filter(Boolean))) as string[], [items]);
  const statuses   = ["SUCCESS", "FAILED", "RUNNING", "NOT_SYNCHRONIZED", "MISSING"];

  const filtered = items.filter(item => {
    if (teamFilter     && !(item.teamName ?? "").toLowerCase().includes(teamFilter.toLowerCase())) return false;
    if (roundFilter    && roundFilter !== "ALL" && item.roundName !== roundFilter)                  return false;
    if (categoryFilter && categoryFilter !== "ALL" && item.categoryName !== categoryFilter)          return false;
    if (languageFilter && languageFilter !== "ALL" && item.repository?.primaryLanguage !== languageFilter) return false;
    if (statusFilter   && statusFilter !== "ALL" && displayStatus(item) !== statusFilter)            return false;
    return true;
  });

  /* ─── Summary counters ──────────────────────────────────────────────────── */
  const successCount = items.filter(i => displayStatus(i) === "SUCCESS").length;
  const failedCount  = items.filter(i => displayStatus(i) === "FAILED").length;
  const missingCount = items.filter(i => displayStatus(i) === "MISSING" || displayStatus(i) === "NOT_SYNCHRONIZED").length;

  return (
    <div className="space-y-4">
      <Card>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch size={18} /> Submission Repositories
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Resync 1 lan cho TAT CA dong dang loc. Bo nut reload rieng: doi bo loc
                da tu tai lai; chon event nam trong panel Filters ben duoi. */}
            <Button variant="outline" size="sm" onClick={handleBulkResync} disabled={bulkSyncing || loading || filtered.length === 0}>
              <RefreshCw size={14} className={`mr-1 ${bulkSyncing ? "animate-spin" : ""}`} />
              {bulkSyncing ? "Resyncing..." : `Resync filtered (${filtered.filter(i => i.repositoryUrl).length})`}
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting || !selectedEventId}
              title={selectedEventId ? "" : "Select a specific event to export CSV"}
              className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
            >
              <Download size={14} className="mr-1" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* ── Summary pills ──────────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                Total: <strong>{items.length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced: <strong>{successCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed: <strong>{failedCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Not synced: <strong>{missingCount}</strong>
              </span>
            </div>
          )}

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div
            className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-xl border border-orange-100"
            style={{ background: "rgba(255,237,213,0.35)", backdropFilter: "blur(8px)" }}
          >
            {/* Event selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Event</label>
              {/* Mac dinh gop TAT CA event Organizer to chuc; chon 1 event de loc.
                  Radix Select khong nhan value="" nen dung sentinel "all". */}
              <Select
                value={selectedEventId || "all"}
                onValueChange={value => setSelectedEventId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-8 min-w-[180px] text-xs rounded-lg outline-none" style={{ border: "1px solid #fdba74", background: "rgba(255,255,255,0.8)" }}>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {events.map(item => (
                    <SelectItem key={item.eventId} value={item.eventId}>{item.eventName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-orange-200 self-end mb-0.5" />

            {/* Team filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Team</label>
              <Input
                placeholder="Search team..."
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="w-36 h-8 text-xs border-orange-200 bg-white/80 focus-visible:ring-orange-300"
              />
            </div>

            {/* Round filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Round</label>
              <Select value={roundFilter || "ALL"} onValueChange={v => setRoundFilter(v === "ALL" ? "" : v)}>
                <SelectTrigger className="h-8 w-32 text-xs rounded-lg outline-none" style={{ border: "1px solid #fdba74", background: "rgba(255,255,255,0.8)" }}>
                  <SelectValue placeholder="All rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All rounds</SelectItem>
                  {rounds.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Category</label>
              <Select value={categoryFilter || "ALL"} onValueChange={v => setCategoryFilter(v === "ALL" ? "" : v)}>
                <SelectTrigger className="h-8 w-36 text-xs rounded-lg outline-none" style={{ border: "1px solid #fdba74", background: "rgba(255,255,255,0.8)" }}>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {categories.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Language filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Language</label>
              <Select value={languageFilter || "ALL"} onValueChange={v => setLanguageFilter(v === "ALL" ? "" : v)}>
                <SelectTrigger className="h-8 w-32 text-xs rounded-lg outline-none" style={{ border: "1px solid #fdba74", background: "rgba(255,255,255,0.8)" }}>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All languages</SelectItem>
                  {languages.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Status</label>
              <Select value={statusFilter || "ALL"} onValueChange={v => setStatusFilter(v === "ALL" ? "" : v)}>
                <SelectTrigger className="h-8 w-36 text-xs rounded-lg outline-none" style={{ border: "1px solid #fdba74", background: "rgba(255,255,255,0.8)" }}>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {statuses.map(name => <SelectItem key={name} value={name}>{formatSyncStatus(name)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters */}
            {(teamFilter || roundFilter || categoryFilter || languageFilter || statusFilter) && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-transparent uppercase tracking-wide select-none">.</label>
                <button
                  className="h-8 px-3 text-xs text-orange-600 hover:text-orange-800 border border-orange-200 hover:border-orange-400 rounded-lg bg-white/70 hover:bg-orange-50 transition-colors"
                  onClick={() => { setTeamFilter(""); setRoundFilter(""); setCategoryFilter(""); setLanguageFilter(""); setStatusFilter(""); }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* ── Table ──────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <RefreshCw size={16} className="animate-spin mr-2" /> Loading submission repositories...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No submission repositories found.
            </div>
          ) : (
            <div
              className="max-h-[calc(100vh-360px)] min-h-[280px] overflow-auto rounded-lg border border-orange-100 shadow-sm backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-orange-100" style={{ background: "rgba(255,237,213,0.7)", backdropFilter: "blur(8px)" }}>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">#</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Team</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Category</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Round</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Repository</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Language</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Branch</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Stats</th>
                    {/* Activity thay cho cot Actions: resync gio lam hang loat bang nut
                        "Resync filtered" o header, khong con nut tung dong. */}
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Activity</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Last Pushed</th>
                    <th className="border-r border-orange-100 px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Last Synced</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-orange-800 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => {
                    const repo   = item.repository;
                    const status = displayStatus(item);
                    const link   = repo?.externalUrl || repo?.repositoryUrl || item.repositoryUrl;
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={item.submissionId}
                        className={`border-b border-orange-50 align-middle transition-colors hover:bg-orange-50/60 ${isEven ? "bg-white/90" : "bg-orange-50/30"}`}
                        style={{ backdropFilter: "blur(4px)" }}
                      >
                        {/* # */}
                        <td className="border-r border-orange-100 px-3 py-2.5 text-xs text-slate-400 font-mono">
                          {index + 1}
                        </td>

                        {/* Team */}
                        <td className="border-r border-orange-100 px-3 py-2.5">
                          {item.sampleSubmission ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                              Sample
                            </span>
                          ) : (
                            <span className="font-medium text-slate-800 text-xs">{item.teamName ?? "—"}</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="border-r border-orange-100 px-3 py-2.5 text-xs text-slate-600">
                          {item.categoryName ?? "—"}
                        </td>

                        {/* Round */}
                        <td className="border-r border-orange-100 px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                          {item.roundName ?? "—"}
                        </td>

                        {/* Repository */}
                        <td className="border-r border-orange-100 px-3 py-2.5 max-w-[220px]">
                          {link ? (
                            <div>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline break-all inline-flex items-center gap-1 text-xs"
                              >
                                <span className="truncate max-w-[180px]" title={repo?.fullName || link}>
                                  {repo?.fullName || link}
                                </span>
                                <ExternalLink size={11} className="flex-shrink-0" />
                              </a>
                              {item.lastPushAfterDeadline === true && (
                                <div className="mt-1 text-[11px] text-amber-600 inline-flex items-center gap-1">
                                  <AlertTriangle size={10} /> After deadline
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No URL</span>
                          )}
                        </td>

                        {/* Language */}
                        <td className="border-r border-orange-100 px-3 py-2.5">
                          {repo?.primaryLanguage ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-medium">
                              {repo.primaryLanguage}
                            </span>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Branch */}
                        <td className="border-r border-orange-100 px-3 py-2.5">
                          {repo?.defaultBranch ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <GitBranch size={11} className="text-slate-400" />
                              {repo.defaultBranch}
                            </span>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Stats */}
                        <td className="border-r border-orange-100 px-3 py-2.5">
                          {repo ? (
                            <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Star size={10} className="text-amber-400" /> {repo.starCount ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <GitFork size={10} className="text-slate-400" /> {repo.forkCount ?? 0}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CircleDot size={10} className="text-slate-400" /> {repo.openIssuesCount ?? 0}
                              </span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Activity: so commit + contributor lay best-effort tu GitHub;
                            trong neu snapshot chua duoc resync bang code moi. */}
                        <td className="border-r border-orange-100 px-3 py-2.5">
                          {repo && (repo.commitCount != null || repo.contributorCount != null) ? (
                            <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <GitCommit size={10} className="text-slate-400" /> {repo.commitCount ?? "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users size={10} className="text-slate-400" /> {repo.contributorCount ?? "—"}
                              </span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Last Pushed */}
                        <td className="border-r border-orange-100 px-3 py-2.5 whitespace-nowrap text-xs text-slate-600">
                          {formatDateTime(repo?.lastPushedAt)}
                        </td>

                        {/* Last Synced */}
                        <td className="border-r border-orange-100 px-3 py-2.5 whitespace-nowrap text-xs text-slate-600">
                          {formatDateTime(repo?.lastSynchronizedAt)}
                        </td>

                        {/* Status (cot cuoi -> khong co border-r) */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={status} />
                            {repo?.errorCode && status === "FAILED" && (
                              <span
                                className="text-[10px] text-red-500 font-mono truncate max-w-[120px]"
                                title={repo.errorMessage ?? repo.errorCode}
                              >
                                {repo.errorCode}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Footer count ───────────────────────────────────────────────── */}
          {filtered.length > 0 && filtered.length !== items.length && (
            <div className="mt-2 text-xs text-slate-400 text-right">
              Showing {filtered.length} of {items.length} submissions
            </div>
          )}
          {filtered.length > 0 && filtered.length === items.length && (
            <div className="mt-2 text-xs text-slate-400 text-right">
              {items.length} submission{items.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
