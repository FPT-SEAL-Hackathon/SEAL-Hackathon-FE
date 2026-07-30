import { useRef, useState } from "react";
import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { calculateTimelineBounds, validateTimeline, pickDefaultPxPerDay } from "./timelineUtils";
import { TimelineValidation } from "./TimelineValidation";
import { TimelineSummary } from "./TimelineSummary";
import { TimelineLegend } from "./TimelineLegend";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineGrid } from "./TimelineGrid";
import { useElementWidth } from "./useDragScroll";
import type { DraftMarker, DraftRange } from "./DraftOverlay";
import { COLORS } from "../../../../components/shared/UIComponents";
import { TooltipProvider } from "../../../../components/ui/tooltip";

interface Props {
    event: EventResponse | null;
    categories: CategoryResponse[];
    rounds: RoundResponse[];
    // Mốc/khoảng của round đang soạn trong RoundForm (Timeline Preview).
    draftMarkers?: DraftMarker[];
    draftRange?: DraftRange;
}

// Mức zoom: null = "Fit" (vừa khung). `touched` phân biệt "user đã tự chọn" với "đang dùng
// mặc định suy ra từ bề rộng khung" — nhờ vậy mặc định được tính theo dữ liệu thật ngay ở
// lần render đầu (không cần useEffect, không nhấp nháy) nhưng vẫn tôn trọng lựa chọn của user.
interface ZoomState {
    touched: boolean;
    pxPerDay: number | null;
}

const INITIAL_ZOOM: ZoomState = { touched: false, pxPerDay: null };

export function EventTimeline({ event, categories, rounds, draftMarkers, draftRange }: Props) {
    // Nút/modal "Expand" đã được bỏ (tạm thời không dùng): zoom −/+/Fit + kéo-để-pan đủ để
    // xem tổng thể ngay tại chỗ. TimelineToolbar vẫn giữ prop `onExpand` optional nếu cần bật lại.
    const [inlineZoom, setInlineZoom] = useState<ZoomState>(INITIAL_ZOOM);

    const inlineRef = useRef<HTMLDivElement>(null);
    const inlinePx = useElementWidth(inlineRef);

    const bounds = calculateTimelineBounds(event, categories, rounds);
    const issues = validateTimeline(event, categories, rounds);

    if (!bounds) {
        return <div className="p-4 text-gray-500 italic text-center">Not enough dates to build timeline.</div>;
    }

    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    const inlinePxPerDay = inlineZoom.touched ? inlineZoom.pxPerDay : pickDefaultPxPerDay(bounds, inlinePx);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col">
                <TimelineSummary event={event} categories={safeCategories} rounds={safeRounds} />
                <TimelineToolbar
                    pxPerDay={inlinePxPerDay}
                    onZoomChange={v => setInlineZoom({ touched: true, pxPerDay: v })}
                    className="mb-3"
                />

                {/* Bản inline: khung cuộn có viền + bo góc, kéo-để-trượt */}
                <div ref={inlineRef}>
                    <TimelineGrid
                        event={event}
                        bounds={bounds}
                        categories={safeCategories}
                        rounds={safeRounds}
                        pxPerDay={inlinePxPerDay}
                        draftMarkers={draftMarkers}
                        draftRange={draftRange}
                        className="w-full rounded-xl border shadow-sm bg-white"
                        style={{ borderColor: COLORS.border }}
                    />
                </div>

                <TimelineValidation issues={issues} />
                <TimelineLegend />
            </div>
        </TooltipProvider>
    );
}
