import { useState, useEffect } from "react";
import { repositoryIntegrationService, type RepositoryResponse, type ConnectIntegrationRequest, type RepositoryIssue } from "@/features/events/api/repositoryIntegrationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, GitBranch, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { eventService } from "@/features/events/api/eventService";
import { parseApiError } from "@/lib/api/apiClient";

export function AdminRepositoryIntegrationsView() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [repositories, setRepositories] = useState<RepositoryResponse[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
  const [issues, setIssues] = useState<RepositoryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    eventService.getAll(true).then(res => {
      setEvents(res);
      if (res.length > 0) {
        setSelectedEventId(res[0].eventId);
      }
    }).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setSelectedRepositoryId(null);
      setIssues([]);
      loadOverview();
    }
  }, [selectedEventId]);

  const loadOverview = async (preferredRepositoryId?: string) => {
    setLoading(true);
    try {
      const data = await repositoryIntegrationService.getRepositories(selectedEventId);
      setRepositories(data);

      const targetId = preferredRepositoryId ?? selectedRepositoryId;
      const nextSelectedId =
        targetId && data.some(r => r.repositoryId === targetId)
          ? targetId
          : data.find(r => r.connectionStatus === 'CONNECTED')?.repositoryId ?? null;

      setSelectedRepositoryId(nextSelectedId);

      if (nextSelectedId) {
        await loadIssues(nextSelectedId);
      } else {
        setIssues([]);
      }
    } catch (e: any) {
      setRepositories([]);
      setIssues([]);
      setSelectedRepositoryId(null);
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async (repoId: string) => {
    setIssuesLoading(true);
    try {
      const res = await repositoryIntegrationService.getRepositoryIssues(selectedEventId, repoId, 0, 100);
      setIssues(res.content);
    } catch (e: any) {
      console.error("Failed to fetch repository issues:", e);
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  const handleSelectRepository = (repoId: string) => {
    setSelectedRepositoryId(repoId);
    loadIssues(repoId);
  };

  const getErrorMessage = (e: any) => {
    const err = parseApiError(e);
    return err.message;
  };

  const handleConnect = async () => {
    if (!repoUrl || !token) {
      toast.error("URL and Token are required");
      return;
    }
    setLoading(true);
    try {
      const syncResult = await repositoryIntegrationService.connectIntegration(selectedEventId, { repositoryUrl: repoUrl, token });
      setRepoUrl("");
      setToken("");

      if (syncResult?.status === "PARTIAL_SUCCESS") {
        toast.warning(syncResult.message || "Repository connected with partial sync");
      } else {
        toast.success(syncResult?.message || "Repository connected successfully");
      }

      await loadOverview(syncResult?.repositoryId);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (repositoryId: string) => {
    setSelectedRepositoryId(repositoryId);
    setSyncing(prev => ({ ...prev, [repositoryId]: true }));
    try {
      const syncResult = await repositoryIntegrationService.syncRepository(selectedEventId, repositoryId);

      if (syncResult?.status === "PARTIAL_SUCCESS") {
        toast.warning(syncResult.message || "Synchronization partially completed");
      } else {
        toast.success(syncResult?.message || "Repository synced successfully");
      }

      await loadOverview(repositoryId);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
      if (e.response?.data?.error === 'REPOSITORY_SYNC_ALREADY_RUNNING') {
         await loadOverview(repositoryId);
      }
    } finally {
      setSyncing(prev => ({ ...prev, [repositoryId]: false }));
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (window.confirm("Are you sure you want to disconnect? Historical data will be preserved.")) {
      try {
        await repositoryIntegrationService.disconnectIntegration(selectedEventId, integrationId);
        toast.success("Repository disconnected successfully");
        await loadOverview();
      } catch (e: any) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const selectedRepo = repositories.find(r => r.repositoryId === selectedRepositoryId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>GitHub Integration</span>
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full font-normal">
              Legacy Event-Level Integration
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Event</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.length === 0 ? (
                <option value="">No events available</option>
              ) : (
                events.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName || ev.name || "Untitled Event"}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
            <h3 className="font-semibold text-lg">Connect Repository</h3>
            <p className="text-sm text-gray-500">Provide a GitHub repository URL and a Personal Access Token with repository permissions.</p>
            <div className="space-y-2">
              <Input
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <Input
                type="password"
                placeholder="GitHub Personal Access Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting..." : "Connect Repository"}
              </Button>
            </div>
          </div>

          {repositories.length > 0 && (
             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Connected Repositories</h3>
                {repositories.map(repo => {
                  const isSelected = repo.repositoryId === selectedRepositoryId;
                  return (
                    <div
                      key={repo.repositoryId}
                      className={`space-y-4 border p-4 rounded-md cursor-pointer transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500" : "hover:border-gray-300"
                      }`}
                      onClick={() => handleSelectRepository(repo.repositoryId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-blue-600" />
                            {repo.repositoryFullName}
                            {isSelected && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-normal">
                                Currently Viewing
                              </span>
                            )}
                            {repo.connectionStatus === 'DISCONNECTED' && (
                               <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full ml-2 flex items-center gap-1 font-normal">
                                  <XCircle className="h-3 w-3" /> Disconnected
                               </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">{repo.description}</p>
                        </div>
                        {repo.connectionStatus === 'CONNECTED' && (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(repo.repositoryId)}
                              disabled={syncing[repo.repositoryId] || repo.syncStatus === 'RUNNING'}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${syncing[repo.repositoryId] || repo.syncStatus === 'RUNNING' ? 'animate-spin' : ''}`} />
                              {repo.syncStatus === 'RUNNING' ? 'Syncing...' : 'Sync Now'}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDisconnect(repo.integrationId)}>
                              Disconnect
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">Connection</span>
                          <span className="font-medium flex items-center gap-1">
                            {repo.connectionStatus === 'CONNECTED' ? (
                              <><CheckCircle2 className="h-4 w-4 text-green-500" /> Connected</>
                            ) : (
                              <><AlertCircle className="h-4 w-4 text-orange-500" /> {repo.connectionStatus}</>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">Last Sync</span>
                          <span className="font-medium">
                            {repo.lastSyncAt ? new Date(repo.lastSyncAt).toLocaleString() : "Never"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-500">Sync Status</span>
                          <span className={`font-medium ${repo.syncStatus === 'PARTIAL_SUCCESS' ? 'text-orange-500' : repo.syncStatus === 'FAILED' ? 'text-red-500' : 'text-green-600'}`}>
                             {repo.syncStatus || "IDLE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          )}

          {selectedRepositoryId && (
            <div className="mt-8 space-y-4">
              <h3 className="font-semibold text-lg flex items-center justify-between">
                <span>
                  Issues for {selectedRepo ? selectedRepo.repositoryFullName : "Selected Repository"}
                  {issues.length > 0 && ` (${issues.length})`}
                </span>
                {issuesLoading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
              </h3>

              {issuesLoading ? (
                <div className="p-8 text-center text-gray-500 border rounded-md">
                  Loading issues...
                </div>
              ) : issues.length > 0 ? (
                <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                  {issues.map(issue => (
                    <div key={issue.issueId} className="p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <a href={issue.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                          #{issue.number} {issue.title}
                        </a>
                        <span className={`px-2 py-1 text-xs rounded-full ${issue.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {issue.state}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>Opened: {new Date(issue.externalCreatedAt).toLocaleString()}</span>
                        {issue.authorUsername && <span>By: {issue.authorUsername}</span>}
                        {issue.labels && <span>Labels: {issue.labels}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 border rounded-md bg-gray-50">
                  <p className="font-medium">No GitHub issues were found for this repository.</p>
                  <p className="text-xs text-gray-400 mt-1">Pull requests are intentionally excluded.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
