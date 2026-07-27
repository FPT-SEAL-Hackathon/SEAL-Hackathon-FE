import { type CSSProperties } from "react";
import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds } from "./timelineUtils";
import { TimeScaleHeader } from "./TimeScaleHeader";
import { MasterTimeline } from "./MasterTimeline";
import { CategoryLane } from "./CategoryLane";
import { CurrentTimeMarker } from "./CurrentTimeMarker";
import { COLORS } from "../../../../components/shared/UIComponents";
import { useDragScroll } from "./useDragScroll";

// Bề rộng canvas tối thiểu: hẹp hơn thì cuộn/kéo ngang.
const MIN_CANVAS_WIDTH = 800;

interface Props {
    event: EventResponse | null;
    bounds: TimelineBounds;
    categories: CategoryResponse[];
    rounds: RoundResponse[];
    // className/style áp cho khung cuộn (viền, bo góc, chiều cao) — dùng chung inline & modal.
    className?: string;
    style?: CSSProperties;
}

/**
 * Lưới timeline cuộn được (header thang thời gian + Event Master + các Category lane).
 * Tách riêng để tái dụng cho cả bản inline lẫn bản trong modal "Mở rộng".
 * Bản thân khung cuộn hỗ trợ kéo-để-trượt (useDragScroll).
 */
export function TimelineGrid({ event, bounds, categories, rounds, className = "", style }: Props) {
    const scrollRef = useDragScroll<HTMLDivElement>();
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    return (
        <div ref={scrollRef} className={`overflow-auto cursor-grab ${className}`} style={style}>
            <div className="flex flex-col relative" style={{ minWidth: MIN_CANVAS_WIDTH }}>
                {/* Header thang thời gian */}
                <div className="flex bg-gray-50/50 sticky top-0 z-30">
                    <div className="w-48 shrink-0 border-r border-b sticky left-0 z-40 bg-gray-50/90 backdrop-blur-sm" style={{ borderColor: COLORS.border }} />
                    <div className="flex-1 relative border-b" style={{ borderColor: COLORS.border }}>
                        <TimeScaleHeader bounds={bounds} />
                    </div>
                </div>

                {/* Vùng các lane */}
                <div className="flex flex-col relative">
                    {/* Đường "thời điểm hiện tại" trải qua mọi lane */}
                    <div className="absolute top-0 bottom-0 left-48 right-0 pointer-events-none z-20">
                        <CurrentTimeMarker bounds={bounds} />
                    </div>

                    {/* Event Master */}
                    <div className="flex">
                        <div className="w-48 shrink-0 sticky left-0 z-30 bg-white" />
                        <div className="flex-1 relative -ml-48">
                            <MasterTimeline event={event} bounds={bounds} />
                        </div>
                    </div>

                    {/* Category lanes */}
                    {safeCategories.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            No categories configured for this event.
                        </div>
                    ) : (
                        safeCategories.map(cat => (
                            <div key={cat.categoryId} className="flex">
                                <div className="w-48 shrink-0 sticky left-0 z-30 bg-white" />
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
    );
}
