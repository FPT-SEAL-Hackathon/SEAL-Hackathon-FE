import { CheckCircle2, ChevronRight } from "lucide-react";
import { COLORS, Button, Card, ProgressBar } from "@/components/shared/UIComponents";
import { type EventResponse } from "@/features/events/api/eventService";
import { type CategoryResponse } from "@/features/categories/api/categoryService";
import { type RoundResponse } from "@/features/judging/api/roundService";

interface JudgeRoundsStepProps {
  event: EventResponse | null;
  category: CategoryResponse | null;
  rounds: RoundResponse[];
  roundStats: Record<string, { total: number, completed: number, isDone: boolean }>;
  onScoreRound: (roundId: string) => void;
  onBack: () => void;
}

export function JudgeRoundsStep({ event, category, rounds, roundStats, onScoreRound, onBack }: JudgeRoundsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Categories
        </Button>
        <div>
          <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            Rounds for: {category ? category.categoryName : 'General Track'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{event ? event.eventName : ''}</p>
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
                    onClick={() => onScoreRound(r.roundId)}
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
}
