import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { calculateTimelineBounds, validateTimeline } from "./timelineUtils";
import { TimeScaleHeader } from "./TimeScaleHeader";
import { MasterTimeline } from "./MasterTimeline";
import { CategoryLane } from "./CategoryLane";
import { CurrentTimeMarker } from "./CurrentTimeMarker";
import { TimelineValidation } from "./TimelineValidation";
import { TimelineSummary } from "./TimelineSummary";
import { TimelineLegend } from "./TimelineLegend";
import { TimelineToolbar } from "./TimelineToolbar";
import { COLORS } from "../../../../components/shared/UIComponents";
import { TooltipProvider } from "../../../../components/ui/tooltip";

interface Props {
    event: EventResponse | null;
    categories: CategoryResponse[];
    rounds: RoundResponse[];
}

export function EventTimeline({ event, categories, rounds }: Props) {
    const bounds = calculateTimelineBounds(event, categories, rounds);
    const issues = validateTimeline(event, categories, rounds);

    if (!bounds) {
        return <div className="p-4 text-gray-500 italic text-center">Not enough dates to build timeline.</div>;
    }

    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col">
                <TimelineSummary event={event} categories={safeCategories} rounds={safeRounds} />
                <TimelineToolbar />
                
                <div 
                    className="w-full bg-white rounded-xl shadow-sm border overflow-x-auto"
                    style={{ borderColor: COLORS.border }}
                >
                    <div className="min-w-[800px] flex flex-col relative">
                        {/* Header scale */}
                        <div className="flex bg-gray-50/50 sticky top-0 z-30">
                            <div className="w-48 shrink-0 border-r border-b sticky left-0 z-40 bg-gray-50/90 backdrop-blur-sm" style={{ borderColor: COLORS.border }} />
                            <div className="flex-1 relative border-b" style={{ borderColor: COLORS.border }}>
                                <TimeScaleHeader bounds={bounds} />
                            </div>
                        </div>

                        {/* Tracks Container */}
                        <div className="flex flex-col relative">
                            {/* Current Time Line spanning across all lanes */}
                            <div className="absolute top-0 bottom-0 left-48 right-0 pointer-events-none z-20">
                                <CurrentTimeMarker bounds={bounds} />
                            </div>

                            {/* Master Event Timeline */}
                            <div className="flex">
                                <div className="w-48 shrink-0 sticky left-0 z-30 bg-white" />
                                <div className="flex-1 relative -ml-48">
                                    <MasterTimeline event={event} bounds={bounds} />
                                </div>
                            </div>

                            {/* Category Lanes */}
                            {safeCategories.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    No categories configured for this event.
                                </div>
                            ) : (
                                safeCategories.map(cat => (
                                    <div key={cat.categoryId} className="flex">
                                        <div className="w-48 shrink-0 sticky left-0 z-30 bg-white group-hover:bg-gray-50 transition-colors" />
                                        <div className="flex-1 relative -ml-48">
                                            <CategoryLane 
                                                category={cat} 
                                                rounds={safeRounds.filter(r => r.categoryId === cat.categoryId)}
                                                bounds={bounds} 
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <TimelineValidation issues={issues} />
                <TimelineLegend />
            </div>
        </TooltipProvider>
    );
}
