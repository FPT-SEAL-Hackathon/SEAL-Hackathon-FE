import { useState, useEffect, useMemo, useRef } from "react";
import { Card, SectionHeader, COLORS, StatusBadge, Button } from "@/components/shared/UIComponents";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { useAuth } from "@/features/auth/store/authStore";
import { CheckCircle, Clock, ChevronDown, Check, X, Search, Filter, Loader2, Edit3, ArrowUpDown, Trash2 } from "lucide-react";

export function JudgeHistoryView({
  apiRounds,
  selectedRoundId,
  onSelectRound,
  apiSubmissions,
  apiCriteria,
  onSelectSubmission,
  onNavigate,
}: {
  apiRounds: any[];
  selectedRoundId: string | null;
  onSelectRound: (id: string) => void;
  apiSubmissions: any[];
  apiCriteria: any[];
  onSelectSubmission?: (sub: any) => void;
  onNavigate?: (page: string) => void;
}) {
  const { user } = useAuth();
  const [scores, setScores] = useState<JudgingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  
  // Search and Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>({ key: "date", direction: "desc" });

  const [localSelectedRoundId, setLocalSelectedRoundId] = useState(selectedRoundId);

  useEffect(() => {
    setLocalSelectedRoundId(selectedRoundId);
  }, [selectedRoundId]);

  const [eventSearchInput, setEventSearchInput] = useState("");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eventSearchRef.current && !eventSearchRef.current.contains(e.target as Node)) {
        setIsEventDropdownOpen(false);
        // Revert input to selected event name if they clicked away without selecting
        if (selectedEventId) {
          const selectedEvent = events.find(ev => ev.eventId === selectedEventId);
          if (selectedEvent) setEventSearchInput(selectedEvent.eventName);
        } else {
          setEventSearchInput("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedEventId, events]);

  useEffect(() => {
    eventService.getAll().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      categoryService.getByEvent(selectedEventId).then(setCategories).catch(console.error);
    } else {
      setCategories([]);
    }
    setSelectedCategoryId(""); // Reset category when event changes
  }, [selectedEventId]);

  const [fetchedRounds, setFetchedRounds] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCategoryId) {
      // Fetch rounds for specific category
      import("@/features/judging/api/roundService").then(({ roundService }) => {
        roundService.getByCategory(selectedCategoryId).then(setFetchedRounds).catch(console.error);
      });
    } else if (selectedEventId && categories.length > 0) {
      // Fetch rounds for all categories in the event
      import("@/features/judging/api/roundService").then(({ roundService }) => {
        Promise.all(categories.map(c => roundService.getByCategory(c.categoryId)))
          .then(results => setFetchedRounds(results.flat()))
          .catch(console.error);
      });
    } else {
      setFetchedRounds([]);
    }
  }, [selectedCategoryId, selectedEventId, categories]);

  const filteredRounds = useMemo(() => {
    if (selectedEventId || selectedCategoryId) {
      return fetchedRounds;
    }
    return apiRounds;
  }, [apiRounds, fetchedRounds, selectedEventId, selectedCategoryId]);

  useEffect(() => {
    if (filteredRounds.length > 0) {
      if (!filteredRounds.find(r => r.roundId === localSelectedRoundId)) {
        setLocalSelectedRoundId(filteredRounds[0].roundId);
      }
    } else {
      setLocalSelectedRoundId("");
    }
  }, [filteredRounds, localSelectedRoundId]);

  const fetchScores = () => {
    if (!user?.userId) return;
    setLoading(true);
    judgingService.getByJudge(user.userId)
      .then(res => setScores(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScores();
  }, [user?.userId]);

  const handleDelete = async (submissionId: string) => {
    const reason = window.prompt("Please provide a reason for deleting your scores:");
    if (reason === null) return; // User cancelled
    
    try {
      setLoading(true);
      await judgingService.deleteScores(submissionId, reason);
      // Reload scores
      fetchScores();
    } catch (error) {
      console.error("Failed to delete scores", error);
      alert("Failed to delete scores. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Aggregate scores by submission
  const historyData = useMemo(() => {
    if (!apiSubmissions.length || !scores.length) return [];
    
    // Group scores by submissionId
    const scoreMap = new Map<string, JudgingDTO[]>();
    scores.forEach(s => {
      if (!scoreMap.has(s.submissionId)) scoreMap.set(s.submissionId, []);
      scoreMap.get(s.submissionId)!.push(s);
    });

    const data: any[] = [];
    const activeRoundName = apiRounds.find(r => r.roundId === selectedRoundId)?.roundName || "Unknown Round";

    apiSubmissions.forEach(sub => {
      const subScores = scoreMap.get(sub.submissionId);
      if (!subScores || subScores.length === 0) return; // Only show scored submissions

      // Map scores to criteria
      const criteriaScores: Record<string, number> = {};
      let total = 0;
      let latestDate = "";
      
      subScores.forEach(s => {
        criteriaScores[s.criterionName] = s.scoreValue;
        total += s.scoreValue;
        if (!latestDate || new Date(s.scoredAt) > new Date(latestDate)) {
          latestDate = s.scoredAt;
        }
      });

      data.push({
        id: sub.submissionId,
        teamId: sub.teamId,
        teamName: sub.teamName || sub.teamId,
        title: sub.notes || `Submission ${sub.submissionId.slice(0, 8)}`,
        roundName: activeRoundName,
        criteriaScores,
        total,
        date: new Date(latestDate).toLocaleDateString(),
        originalSub: sub,
      });
    });
    return data;
  }, [apiSubmissions, scores, apiRounds, selectedRoundId]);

  // Unique teams for the dropdown
  const uniqueTeams = useMemo(() => {
    const teams = new Map<string, string>();
    historyData.forEach(d => teams.set(d.teamId, d.teamName));
    return Array.from(teams.entries());
  }, [historyData]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Final filtering and sorting
  const finalData = useMemo(() => {
    let result = historyData;
    
    if (selectedTeamId) {
      result = result.filter(d => d.teamId === selectedTeamId);
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.teamName || "").toLowerCase().includes(lower) || 
        (d.title || "").toLowerCase().includes(lower)
      );
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        if (sortConfig.key === "total") {
          return sortConfig.direction === "asc" ? a.total - b.total : b.total - a.total;
        }
        if (sortConfig.key === "date") {
          const tA = new Date(a.date).getTime();
          const tB = new Date(b.date).getTime();
          return sortConfig.direction === "asc" ? tA - tB : tB - tA;
        }
        return 0;
      });
    }

    return result;
  }, [historyData, selectedTeamId, searchQuery, sortConfig]);

  // Columns based on dynamic criteria for this round
  const criteriaNames = apiCriteria.map(c => c.criterionName);

  const eventDropdownSuggestions = events.filter(e => 
    e.eventName.toLowerCase().includes(eventSearchInput.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-2">
        <SectionHeader title="Score History" subtitle="All evaluations you have completed for this round" />
        
        {/* Cascade Filters */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2" ref={eventSearchRef}>
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Event:</span>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 focus:bg-white transition-colors text-sm w-48 truncate"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
                value={eventSearchInput}
                onChange={(e) => {
                  setEventSearchInput(e.target.value);
                  setIsEventDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsEventDropdownOpen(true);
                  if (selectedEventId) setEventSearchInput(""); // Clear on focus to allow easy new search
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && eventDropdownSuggestions.length > 0) {
                    const firstMatch = eventDropdownSuggestions[0];
                    setSelectedEventId(firstMatch.eventId);
                    setEventSearchInput(firstMatch.eventName);
                    setIsEventDropdownOpen(false);
                  }
                }}
              />
              {isEventDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto" style={{ borderColor: COLORS.border }}>
                  <div 
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b"
                    style={{ borderColor: COLORS.border, color: !selectedEventId ? COLORS.primary : COLORS.textPrimary, fontWeight: !selectedEventId ? 600 : 400 }}
                    onClick={() => {
                      setSelectedEventId("");
                      setEventSearchInput("");
                      setIsEventDropdownOpen(false);
                    }}
                  >
                    All Events
                  </div>
                  {eventDropdownSuggestions.length > 0 ? (
                    eventDropdownSuggestions.map(ev => (
                      <div 
                        key={ev.eventId}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                        style={{ borderColor: COLORS.border, color: selectedEventId === ev.eventId ? COLORS.primary : COLORS.textPrimary, fontWeight: selectedEventId === ev.eventId ? 600 : 400 }}
                        onClick={() => {
                          setSelectedEventId(ev.eventId);
                          setEventSearchInput(ev.eventName);
                          setIsEventDropdownOpen(false);
                        }}
                      >
                        {ev.eventName}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-center" style={{ color: COLORS.textSecondary }}>No events found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
            <select 
              value={selectedCategoryId} 
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm w-40 truncate"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              disabled={!selectedEventId}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Round:</span>
            <select 
              value={localSelectedRoundId || ""} 
              onChange={(e) => {
                setLocalSelectedRoundId(e.target.value);
                setSelectedTeamId(""); // reset team
              }}
              className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm w-40 truncate"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
            >
              {filteredRounds && filteredRounds.length > 0 ? (
                filteredRounds.map(r => (
                  <option key={r.roundId} value={r.roundId}>{r.roundName}</option>
                ))
              ) : (
                <option value="">No rounds found</option>
              )}
            </select>
          </div>

          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => {
              if (localSelectedRoundId) {
                onSelectRound(localSelectedRoundId);
                fetchScores();
              }
            }}
            style={{ padding: "6px 16px", height: "auto" }}
            disabled={!localSelectedRoundId}
          >
            <Search size={14} className="mr-1 inline-block" /> Search
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="p-4 border-b border-gray-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-gray-50/50 rounded-t-xl">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Team or Project title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              style={{ borderColor: COLORS.border }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Team Filter:</span>
            <select 
              value={selectedTeamId} 
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="px-3 py-2 border rounded-xl outline-none bg-white hover:bg-gray-50 transition-colors cursor-pointer text-sm w-48 truncate"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
            >
              <option value="">All Scored Teams</option>
              {uniqueTeams.map(([tId, tName]) => (
                <option key={tId} value={tId}>{tName}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : finalData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50">
            {historyData.length === 0 ? "You haven't evaluated any teams in this round yet." : "No matching evaluations found for your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b">TEAM</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b">TITLE</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b">ROUND</th>
                  {criteriaNames.map(c => (
                    <th key={c} className="px-4 py-3 text-xs font-semibold text-gray-500 border-b">{c.toUpperCase()}</th>
                  ))}
                  <th 
                    className="px-4 py-3 text-xs font-semibold text-gray-500 border-b cursor-pointer hover:bg-gray-100 transition-colors select-none" 
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center gap-1">TOTAL <ArrowUpDown size={12} className={sortConfig?.key === "total" ? "text-primary" : "text-gray-400"} /></div>
                  </th>
                  <th 
                    className="px-4 py-3 text-xs font-semibold text-gray-500 border-b cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">DATE <ArrowUpDown size={12} className={sortConfig?.key === "date" ? "text-primary" : "text-gray-400"} /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 border-b text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {finalData.map((row, i) => {
                  let totalColor = COLORS.error;
                  if (row.total >= 80) totalColor = COLORS.success;
                  else if (row.total >= 50) totalColor = COLORS.warning;

                  return (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{row.teamName}</td>
                      <td className="px-4 py-4 text-xs text-gray-600 max-w-[200px] truncate" title={row.title}>{row.title}</td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">{row.roundName}</span>
                      </td>
                      {criteriaNames.map((c, j) => (
                        <td key={j} className="px-4 py-4 text-sm font-medium text-gray-600">
                          {row.criteriaScores[c] ?? "-"}
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-sm font-bold" style={{ backgroundColor: `${totalColor}15`, color: totalColor }}>
                          {row.total}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">{row.date}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<Edit3 size={14} />} 
                            onClick={() => {
                              if (onSelectSubmission && onNavigate) {
                                onSelectSubmission({
                                  id: row.id,
                                  team: row.teamId,
                                  title: row.title,
                                  track: "—",
                                  status: "completed",
                                  score: row.total,
                                  round: row.roundName,
                                  github: row.originalSub.repositoryUrl ?? "",
                                  demo: row.originalSub.demoUrl ?? "",
                                  slide: row.originalSub.slideUrl ?? "",
                                  report: row.originalSub.reportUrl ?? "",
                                  raw: row.originalSub
                                });
                                onNavigate("scoring");
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            icon={<Trash2 size={14} />} 
                            style={{ borderColor: COLORS.error, color: COLORS.error }}
                            onClick={() => handleDelete(row.id)}
                            title="Delete Scores"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
