import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Loader2, CheckCircle2, Target } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, ProgressBar, Button } from "@/components/shared/UIComponents";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { useAuth } from "@/features/auth/store/authStore";
import { Calendar } from "lucide-react";
import { JudgeEventsStep } from "./JudgeEventsStep";

interface JudgeRoundsViewProps {
  apiRounds: RoundResponse[];
  onSelectRound: (roundId: string) => void;
  onNavigate: (page: string) => void;
  isLoadingRounds?: boolean;
}

export function JudgeRoundsView({ apiRounds, onSelectRound, onNavigate, isLoadingRounds = false }: JudgeRoundsViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Data State
  const [scores, setScores] = useState<JudgingDTO[]>([]);
  const [roundSubmissions, setRoundSubmissions] = useState<Record<string, SubmissionResponse[]>>({});
  const [categories, setCategories] = useState<Record<string, CategoryResponse>>({});
  const [events, setEvents] = useState<Record<string, EventResponse>>({});

  useEffect(() => {
    if (!user?.userId || !apiRounds || apiRounds.length === 0) {
      return;
    }

    setLoading(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("API ROUNDS:", apiRounds);
        const uniqueCatIds = Array.from(new Set(apiRounds.map(r => r.categoryId).filter(Boolean)));
        console.log("UNIQUE CAT IDS:", uniqueCatIds);
        
        // 1. Fetch categories
        const catPromises = uniqueCatIds.map(id => 
          categoryService.getById(id)
            .then(res => { console.log("FETCHED CAT:", id, res); return res; })
            .catch(err => { console.error("FAILED FETCH CAT:", id, err); return null; })
        );
        const cats = await Promise.all(catPromises);
        console.log("ALL CATS FETCHED:", cats);
        
        const catsMap: Record<string, CategoryResponse> = {};
        const eventIds = new Set<string>();
        cats.forEach(c => {
          if (c) {
            const actualCategory = (c as any).data || c;
            catsMap[actualCategory.categoryId] = actualCategory;
            if (actualCategory.eventId) eventIds.add(actualCategory.eventId);
          }
        });
        
        // 2. Fetch Events
        const eventPromises = Array.from(eventIds).map(eid => eventService.getById(eid, true).catch(() => null));
        const evs = await Promise.all(eventPromises);
        
        const eventsMap: Record<string, EventResponse> = {};
        evs.forEach(e => {
          if (e) {
            const actualEvent = (e as any).data || e;
            eventsMap[actualEvent.eventId] = actualEvent;
          }
        });
        
        setCategories(catsMap);
        setEvents(eventsMap);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, apiRounds]);

  // Aggregate stats
  const { roundStats, globalStats } = useMemo(() => {
    const scoreMap = new Map<string, number>();
    const submissionTotalScoreMap = new Map<string, number>();

    scores.forEach(s => {
      if (!scoreMap.has(s.submissionId)) scoreMap.set(s.submissionId, 0);
      if (!submissionTotalScoreMap.has(s.submissionId)) submissionTotalScoreMap.set(s.submissionId, 0);
      
      scoreMap.set(s.submissionId, scoreMap.get(s.submissionId)! + 1);
      submissionTotalScoreMap.set(s.submissionId, submissionTotalScoreMap.get(s.submissionId)! + s.scoreValue);
    });

    const rStats: Record<string, { total: number, completed: number, isDone: boolean }> = {};
    let gTotalAssigned = 0;
    let gCompleted = 0;
    let sumTotalScores = 0;
    let sumCountScores = 0;

    apiRounds.forEach(r => {
      const subs = roundSubmissions[r.roundId] || [];
      const totalInRound = subs.length;
      let completedInRound = 0;

      subs.forEach(sub => {
        if (scoreMap.has(sub.submissionId) && scoreMap.get(sub.submissionId)! > 0) {
          completedInRound++;
          gCompleted++;
          sumTotalScores += submissionTotalScoreMap.get(sub.submissionId)!;
          sumCountScores++;
        }
      });

      rStats[r.roundId] = {
        total: totalInRound,
        completed: completedInRound,
        isDone: totalInRound > 0 && completedInRound === totalInRound
      };
      
      gTotalAssigned += totalInRound;
    });

    return {
      roundStats: rStats,
      globalStats: {
        totalAssigned: gTotalAssigned,
        completed: gCompleted,
        pending: Math.max(0, gTotalAssigned - gCompleted),
        avgScore: sumCountScores > 0 ? (sumTotalScores / sumCountScores).toFixed(1) : "0.0"
      }
    };
  }, [scores, roundSubmissions, apiRounds]);

  // Grouping logic & Search Filter
  const { eventGroups, categoryGroups, roundGroups, visibleEventIds } = useMemo(() => {
    const eGroups: Record<string, { event: EventResponse | null, totalRounds: number, completedRounds: number }> = {};
    const cGroups: Record<string, Record<string, { category: CategoryResponse | null, totalRounds: number, completedRounds: number }>> = {};
    const rGroups: Record<string, Record<string, RoundResponse[]>> = {};

    const sorted = [...apiRounds].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));
    
    sorted.forEach(r => {
      const catId = r.categoryId || 'unassigned_category';
      const eventId = categories[catId]?.eventId || 'unassigned_event';
      const isCompleted = roundStats[r.roundId]?.isDone ? 1 : 0;

      if (!eGroups[eventId]) {
        eGroups[eventId] = { event: events[eventId] || null, totalRounds: 0, completedRounds: 0 };
      }
      eGroups[eventId].totalRounds++;
      eGroups[eventId].completedRounds += isCompleted;

      if (!cGroups[eventId]) cGroups[eventId] = {};
      if (!cGroups[eventId][catId]) {
        cGroups[eventId][catId] = { category: categories[catId] || null, totalRounds: 0, completedRounds: 0 };
      }
      cGroups[eventId][catId].totalRounds++;
      cGroups[eventId][catId].completedRounds += isCompleted;

      if (!rGroups[eventId]) rGroups[eventId] = {};
      if (!rGroups[eventId][catId]) rGroups[eventId][catId] = [];
      rGroups[eventId][catId].push(r);
    });

    const sortedEventEntries = Object.entries(eGroups).sort(([, a], [, b]) => {
      return new Date(b.event?.startDate || 0).getTime() - new Date(a.event?.startDate || 0).getTime();
    });

    let visibleEventEntries = [];
    if (searchQuery.trim() === '') {
      visibleEventEntries = sortedEventEntries.slice(0, 2);
    } else {
      const q = searchQuery.toLowerCase();
      visibleEventEntries = sortedEventEntries.filter(([, data]) => 
        data.event?.eventName.toLowerCase().includes(q)
      );
    }

    const filteredEGroups = Object.fromEntries(visibleEventEntries);
    const vEventIds = visibleEventEntries.map(([id]) => id);

    return { eventGroups: filteredEGroups, categoryGroups: cGroups, roundGroups: rGroups, visibleEventIds: vEventIds };
  }, [apiRounds, categories, events, roundStats, searchQuery]);

  const [statsLoading, setStatsLoading] = useState(false);
  const fetchedRoundsRef = useRef<Set<string>>(new Set());

  // Lazy load submissions and scores based on visible events or selected category
  useEffect(() => {
    if (!user?.userId || !apiRounds) return;
    
    // Prevent fetching before categories/events are loaded
    const dataReady = apiRounds.length === 0 || Object.keys(categories).length > 0;
    if (!dataReady || loading) return;

    const roundsToFetch = apiRounds.filter(r => {
      const catId = r.categoryId || 'unassigned_category';
      const eventId = categories[catId]?.eventId || 'unassigned_event';
      const isVisibleEvent = visibleEventIds?.includes(eventId);
      const isSelectedCategory = catId === selectedCategoryId;
      return (isVisibleEvent || isSelectedCategory) && !fetchedRoundsRef.current.has(r.roundId);
    });

    if (roundsToFetch.length === 0) return;

    roundsToFetch.forEach(r => fetchedRoundsRef.current.add(r.roundId));

    const fetchVisibleStats = async () => {
      setStatsLoading(true);
      try {
        const subPromises = roundsToFetch.map(r => 
          submissionService.getByRound(r.roundId)
            .then(subs => ({ id: r.roundId, data: subs }))
            .catch(() => ({ id: r.roundId, data: [] }))
        );
        const scorePromise = judgingService.getByJudge(user.userId).catch(() => []);
        
        const [subs, scoresRes] = await Promise.all([
          Promise.all(subPromises),
          scorePromise
        ]);
        
        setRoundSubmissions(prev => {
          const subsMap = { ...prev };
          subs.forEach((s: any) => subsMap[s.id] = s.data);
          return subsMap;
        });
        
        setScores(prev => {
           if (prev.length === 0 && scoresRes) return scoresRes;
           return prev;
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchVisibleStats();
  }, [selectedCategoryId, apiRounds, categories, user?.userId, visibleEventIds, loading]);



  const renderContent = () => {
    if (Object.keys(eventGroups).length === 0 && Object.keys(events).length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
          <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>No evaluation rounds assigned to you yet.</p>
        </div>
      );
    }

    if (!selectedEventId) {
      return (
        <JudgeEventsStep 
          eventGroups={eventGroups}
          onSelectEvent={setSelectedEventId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          events={events}
        />
      );
    }

    // STEP 2: CATEGORY SELECTION
    if (!selectedCategoryId) {
      const eventCats = categoryGroups[selectedEventId] || {};
      const ev = events[selectedEventId];
      
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedEventId(null)}>
              Back to Events
            </Button>
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Categories for: {ev ? ev.eventName : 'General Event'}
            </h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {Object.entries(eventCats).map(([catId, data]) => {
              const cat = data.category;
              const isDone = data.totalRounds > 0 && data.completedRounds === data.totalRounds;
              return (
                <div 
                  key={catId} 
                  className="bg-white rounded-2xl px-6 py-5 border-2 hover:border-primary/30 transition-all cursor-pointer flex flex-row items-center justify-between shadow-sm"
                  onClick={() => setSelectedCategoryId(catId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="inline-block px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider uppercase" style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}>
                      {cat ? cat.categoryName : 'Unknown Category'}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-gray-500">
                      {data.completedRounds} / {data.totalRounds} Rounds Scored
                    </span>
                    {isDone ? <CheckCircle2 size={24} className="text-green-500" /> : <ChevronRight size={24} className="text-gray-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // STEP 3: ROUND SELECTION
    const rounds = roundGroups[selectedEventId]?.[selectedCategoryId] || [];
    const ev = events[selectedEventId];
    const cat = categories[selectedCategoryId];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedCategoryId(null)}>
            Back to Categories
          </Button>
          <div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              Rounds for: {cat ? cat.categoryName : 'General Track'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{ev ? ev.eventName : ''}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 relative">
          {rounds.map((r, index) => {
            const stats = roundStats[r.roundId] || { total: 0, completed: 0, isDone: false };
            const isCompleted = stats.isDone;

            return (
              <div key={r.roundId} className="relative group">
                <Card className={`px-6 py-5 flex flex-row items-center justify-between border-2 hover:border-primary/30 transition-all z-10 ${r.isCalibrationRound ? 'bg-amber-50/50 border-amber-200' : 'bg-white'}`} style={{ opacity: isCompleted ? 0.8 : 1, borderColor: isCompleted ? COLORS.success + '40' : (r.isCalibrationRound ? '#fcd34d' : 'transparent'), boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-sm" style={{ background: isCompleted ? COLORS.success : COLORS.textPrimary }}>
                      {r.roundOrder || index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{r.roundName}</div>
                        <div className="flex items-center px-3 py-1 rounded-full bg-[#f5f0e6] text-[#7a6f5d] text-[11px] font-bold border border-[#e8dfcf]">
                          {r.roundStatusName || "Submission Open"}
                        </div>
                        {r.isCalibrationRound && (
                          <div className="flex items-center px-3 py-1 rounded-full bg-[#fff8eb] text-[#f59e0b] text-[11px] font-bold border border-[#fef3c7]">
                            Calibration
                          </div>
                        )}
                        {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500, marginTop: 4 }}>
                        Deadline: <span className="text-gray-700">{r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center px-8">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                      <span className="text-sm font-bold" style={{ color: isCompleted ? COLORS.success : COLORS.primary }}>
                        {stats.completed} / {stats.total}
                      </span>
                    </div>
                    <ProgressBar 
                      value={stats.completed} 
                      max={Math.max(stats.total, 1)} 
                      color={isCompleted ? COLORS.success : COLORS.primary} 
                    />
                    {stats.total === 0 && (
                      <div className="text-[11px] text-gray-400 mt-1 italic">No teams assigned yet.</div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end flex-1">
                    <Button 
                      variant={isCompleted ? "outline" : "primary"} 
                      size="sm" 
                      icon={<ChevronRight size={16} />} 
                      onClick={() => { 
                        onSelectRound(r.roundId); 
                        onNavigate("submissions"); 
                      }}
                    >
                      {isCompleted ? "Review Scores" : "Score Now"}
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      

      {(loading || isLoadingRounds) ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {renderContent()}
        </div>
      )}

      {!(loading || isLoadingRounds) && (
        <Card className="p-5 mt-6 shadow-sm border-gray-100">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Your Global Statistics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Assigned", value: globalStats.totalAssigned, color: COLORS.primary },
              { label: "Completed", value: globalStats.completed, color: COLORS.success },
              { label: "Pending", value: globalStats.pending, color: COLORS.warning },
              { label: "Avg Score Given", value: globalStats.avgScore, color: COLORS.accent },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl border" style={{ background: `${s.color}05`, borderColor: `${s.color}15` }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
