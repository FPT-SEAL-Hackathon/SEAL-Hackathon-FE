import { Calendar, CheckCircle2, ChevronRight, Search } from "lucide-react";
import { COLORS } from "@/components/shared/UIComponents";
import { type EventResponse } from "@/features/events/api/eventService";

interface JudgeEventsStepProps {
  eventGroups: Record<string, { event: EventResponse | null, totalRounds: number, completedRounds: number }>;
  onSelectEvent: (eventId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function JudgeEventsStep({ eventGroups, onSelectEvent, searchQuery, onSearchChange }: JudgeEventsStepProps) {
  if (Object.keys(eventGroups).length === 0 && !searchQuery) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
        <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>No evaluation rounds assigned to you yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>Select an Event</h2>
        
        {/* SEARCH BAR */}
        <div className="relative w-full md:w-72 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center px-3 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary" style={{ borderColor: COLORS.border }}>
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            className="block w-full pl-2 py-2 bg-transparent leading-5 placeholder-gray-500 focus:outline-none sm:text-sm border-none focus:ring-0"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {Object.keys(eventGroups).length === 0 && searchQuery ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
          <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>No events found matching "{searchQuery}".</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(eventGroups).map(([eventId, data]) => {
            const ev = data.event;
            const isDone = data.totalRounds > 0 && data.completedRounds === data.totalRounds;
            return (
              <div 
                key={eventId} 
                className="bg-white rounded-2xl px-6 py-5 border-2 hover:border-primary/30 transition-all cursor-pointer flex flex-row items-center justify-between shadow-sm"
                onClick={() => onSelectEvent(eventId)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm font-bold" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})` }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                      {ev ? ev.eventName : 'Unknown Event'}
                    </h3>
                    <p className="text-sm text-gray-500">Evaluation Event</p>
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
      )}
    </div>
  );
}
