import { useState, useEffect, useMemo } from "react";
import { ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, ProgressBar, Button } from "@/components/shared/UIComponents";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { useAuth } from "@/features/auth/store/authStore";
import { Calendar } from "lucide-react";

interface JudgeRoundsViewProps {
  apiRounds: RoundResponse[];
  onSelectRound: (roundId: string) => void;
  onNavigate: (page: string) => void;
  isLoadingRounds?: boolean;
}

export function JudgeRoundsView({ apiRounds, onSelectRound, onNavigate, isLoadingRounds = false }: JudgeRoundsViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
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
        const uniqueCatIds = Array.from(new Set(apiRounds.map(r => r.categoryId).filter(Boolean)));
        
        // 1. Fetch categories
        const catPromises = uniqueCatIds.map(id => categoryService.getById(id).catch(() => null));
        const cats = await Promise.all(catPromises);
        
        const catsMap: Record<string, CategoryResponse> = {};
        const eventIds = new Set<string>();
        cats.forEach(c => {
          if (c) {
            catsMap[c.categoryId] = c;
            if (c.eventId) eventIds.add(c.eventId);
          }
        });
        
        // 2. Fetch Events
        const eventPromises = Array.from(eventIds).map(eid => eventService.getById(eid, true).catch(() => null));
        const evs = await Promise.all(eventPromises);
        
        const eventsMap: Record<string, EventResponse> = {};
        evs.forEach(e => {
          if (e) eventsMap[e.eventId] = e;
        });
        
        // 3. Fetch submissions and scores
        const subPromises = apiRounds.map(r => 
          submissionService.getByRound(r.roundId)
            .then(subs => ({ id: r.roundId, data: subs }))
            .catch(() => ({ id: r.roundId, data: [] }))
        );
        const scorePromise = judgingService.getByJudge(user.userId).catch(() => []);
        
        const [subs, scoresRes] = await Promise.all([
          Promise.all(subPromises),
          scorePromise
        ]);
        
        const subsMap: Record<string, SubmissionResponse[]> = {};
        subs.forEach((s: any) => subsMap[s.id] = s.data);
        
        setCategories(catsMap);
        setEvents(eventsMap);
        setRoundSubmissions(subsMap);
        setScores(scoresRes || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [user?.userId, apiRounds]);

  // Aggregate stats
  const { roundStats, globalStats } = useMemo(() => {
    // Group scores by submission
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
        // A submission is considered scored if the judge has provided scores for it
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

  // Group rounds by Event
  const groupedRounds = useMemo(() => {
    const groups: Record<string, RoundResponse[]> = {};
    const sorted = [...apiRounds].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));
    
    sorted.forEach(r => {
      const catId = r.categoryId || 'unassigned';
      const eventId = categories[catId]?.eventId || 'unassigned_event';
      if (!groups[eventId]) groups[eventId] = [];
      groups[eventId].push(r);
    });
    return groups;
  }, [apiRounds, categories]);

  return (
    <>
      <SectionHeader title="Assigned Rounds" subtitle="SEAL Fall 2025 — Your evaluation assignments" />
      
      {(loading || isLoadingRounds) ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRounds).length > 0 ? Object.entries(groupedRounds).map(([eventId, rounds]) => {
            const ev = events[eventId];
            return (
              <div key={eventId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${COLORS.primary}, ${COLORS.accent})` }}></div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 pl-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-bold" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
                      {ev ? ev.eventName : 'General Event'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Evaluation Event</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative pl-2">
                  {rounds.map((r, index) => {
                    const stats = roundStats[r.roundId] || { total: 0, completed: 0, isDone: false };
                    const isCompleted = stats.isDone;
                    const cat = categories[r.categoryId];

                    return (
                      <div key={r.roundId} className="relative group">
                        {index < rounds.length - 1 && (
                          <div className="hidden lg:block absolute top-1/2 left-[calc(100%-1rem)] w-[calc(100%+2rem)] h-0.5 bg-gray-100 -z-10 -translate-y-1/2">
                            <div className="h-full bg-primary/30" style={{ width: isCompleted ? '100%' : '0%', transition: 'width 0.5s' }}></div>
                          </div>
                        )}
                        
                        <Card className="p-5 flex flex-col h-full bg-white border-2 hover:border-primary/30 transition-all z-10" style={{ opacity: isCompleted ? 0.8 : 1, borderColor: isCompleted ? COLORS.success + '40' : 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                          
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase mb-2" style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}>
                                {cat ? cat.categoryName : 'General Track'}
                              </div>
                              <div className="flex items-center gap-2">
                                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{r.roundName}</div>
                                {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-6 mt-2 flex-1">
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                              <span className="text-xs font-bold" style={{ color: isCompleted ? COLORS.success : COLORS.primary }}>
                                {stats.completed} / {stats.total}
                              </span>
                            </div>
                            <ProgressBar 
                              value={stats.completed} 
                              max={Math.max(stats.total, 1)} 
                              color={isCompleted ? COLORS.success : COLORS.primary} 
                            />
                            {stats.total === 0 && (
                              <div className="text-[11px] text-gray-400 mt-2 italic">No teams assigned yet.</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                            <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>
                              DL: <span className="text-gray-700">{r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleDateString() : "N/A"}</span>
                            </span>
                            <Button 
                              variant={isCompleted ? "outline" : "primary"} 
                              size="sm" 
                              icon={<ChevronRight size={14} />} 
                              onClick={() => { 
                                onSelectRound(r.roundId); 
                                onNavigate("submissions"); 
                              }}
                            >
                              {isCompleted ? "Review Scores" : "Score Now"}
                            </Button>
                          </div>
                        </Card>
                        
                        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white z-20 pointer-events-none" style={{ background: isCompleted ? COLORS.success : COLORS.textPrimary }}>
                          {r.roundOrder || index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
              <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>No evaluation rounds assigned to you yet.</p>
            </div>
          )}
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
