import { useState } from "react";
import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { calculateTimelineBounds, validateTimeline } from "./timelineUtils";
import { TimelineValidation } from "./TimelineValidation";
import { TimelineSummary } from "./TimelineSummary";
import { TimelineLegend } from "./TimelineLegend";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineGrid } from "./TimelineGrid";
import { COLORS } from "../../../../components/shared/UIComponents";
import { TooltipProvider } from "../../../../components/ui/tooltip";
import { Dialog, DialogContent, DialogTitle } from "../../../../components/ui/dialog";

interface Props {
    event: EventResponse | null;
    categories: CategoryResponse[];
    rounds: RoundResponse[];
}

export function EventTimeline({ event, categories, rounds }: Props) {
    // Modal "Mở rộng": Radix Dialog tự đóng khi bấm ra ngoài (overlay) hoặc nhấn Esc.
    const [expanded, setExpanded] = useState(false);

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
                <TimelineToolbar onExpand={() => setExpanded(true)} />

                {/* Bản inline: khung cuộn có viền + bo góc, kéo-để-trượt */}
                <TimelineGrid
                    event={event}
                    bounds={bounds}
                    categories={safeCategories}
                    rounds={safeRounds}
                    className="w-full rounded-xl border shadow-sm bg-white"
                    style={{ borderColor: COLORS.border }}
                />

                <TimelineValidation issues={issues} />
                <TimelineLegend />

                {/* Bản mở rộng: cùng lưới timeline nhưng to hơn, trong modal bấm-ngoài-đóng */}
                <Dialog open={expanded} onOpenChange={setExpanded}>
                    <DialogContent className="w-[96vw] max-w-[96vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
                        <div className="flex items-center px-5 py-3 border-b shrink-0" style={{ borderColor: COLORS.border }}>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-900">Event Schedule Timeline</DialogTitle>
                                <p className="text-xs text-gray-500">Kéo để xem · bấm ra ngoài hoặc nhấn Esc để đóng</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 p-3 bg-gray-50/40">
                            <TimelineGrid
                                event={event}
                                bounds={bounds}
                                categories={safeCategories}
                                rounds={safeRounds}
                                className="w-full h-full rounded-lg border bg-white"
                                style={{ borderColor: COLORS.border }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
