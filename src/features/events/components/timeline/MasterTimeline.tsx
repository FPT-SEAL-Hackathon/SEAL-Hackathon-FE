import { EventResponse } from "../../api/eventService";
import { TimelineBounds, getPercentage, getWidthPercentage, parseSafeDate } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";

interface Props {
    event: EventResponse | null;
    bounds: TimelineBounds;
    // Bề rộng thực (px) của track, do TimelineGrid tính từ mức zoom.
    trackPx: number;
}

// Bề rộng px tối thiểu để nhãn chữ (REGISTRATION / EVENT LIVE) còn đọc được bên trong.
const MIN_LABEL_PX = 90;
// Thanh hẹp hơn mức này vẫn phải bấm/hover được, nên ép bề rộng tối thiểu.
const MIN_BAR_PX = 6;

export function MasterTimeline({ event, bounds, trackPx }: Props) {
    if (!event) return null;

    const regStartPct = getPercentage(event.registrationStart, bounds);
    const regWidth = getWidthPercentage(event.registrationStart, event.registrationEnd, bounds);

    // eventStartDate/eventEndDate là LocalDateTime ở backend (EventResponse.java) → dùng
    // TRỰC TIẾP, không ghép thêm giờ. Trước đây code ghép `${eventEndDate}T23:59:59` vì
    // tưởng đây là date-only; với chuỗi đã có giờ ("2026-08-10T00:00") phép ghép tạo ra
    // "2026-08-10T00:00T23:59:59" = Invalid Date → getPercentage trả 0 → thanh Event Live
    // rộng 0px, chỉ còn 2 dấu tròn chồng nhau và nhãn EVENT LIVE bị ẩn.
    const eventStartPct = getPercentage(event.eventStartDate, bounds);
    const eventWidth = getWidthPercentage(event.eventStartDate, event.eventEndDate, bounds);

    // Cả 4 mốc (registration + event) đều là LocalDateTime → hiển thị ngày kèm giờ.
    // parseSafeDate diễn giải chuỗi ở local timezone, khớp với trục timeline.
    const formatDt = (d?: string | null) => {
        const parsed = parseSafeDate(d);
        return parsed ? parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown";
    };

    // Quyết định hiện nhãn chữ theo BỀ RỘNG PX THẬT thay vì ngưỡng % cứng: cùng một
    // khoảng thời gian sẽ rộng/hẹp khác nhau tuỳ mức zoom.
    const regWidthPx = (regWidth / 100) * trackPx;
    const eventWidthPx = (eventWidth / 100) * trackPx;

    return (
        <div className="relative py-4 flex border-b bg-white" style={{ borderColor: COLORS.border }}>
            {/* Label — dính (sticky) khi kéo ngang để luôn thấy tên hàng */}
            <div className="w-48 shrink-0 px-4 flex flex-col justify-center border-r sticky left-0 z-30 bg-white" style={{ borderColor: COLORS.border }}>
                <span className="font-bold text-sm text-gray-800">Event Master</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Registration & Live</span>
            </div>
            
            {/* Track — Registration ở đường trên (35%), Event Live ở đường dưới (70%)
                để hai thanh không đè lên nhau khi đăng ký kéo dài vào lúc event bắt đầu. */}
            <div className="relative flex-1 h-16 bg-transparent overflow-hidden">
                {/* Guide lines cho 2 đường */}
                <div className="absolute left-0 right-0 h-px bg-gray-200 z-0" style={{ top: '35%' }} />
                <div className="absolute left-0 right-0 h-px bg-gray-200 z-0" style={{ top: '70%' }} />
                {/* Registration Block */}
                {event.registrationStart && event.registrationEnd && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute -translate-y-1/2 h-2 rounded-full bg-blue-400 cursor-pointer shadow-sm hover:h-2.5 transition-all z-10"
                                style={{ top: '35%', left: `${regStartPct}%`, width: `${regWidth}%`, minWidth: MIN_BAR_PX }}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-400 rounded-full" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-400 rounded-full" />
                                {regWidthPx > MIN_LABEL_PX && <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-blue-600 font-bold tracking-wider">REGISTRATION</span>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs">
                                <div className="font-bold border-b border-gray-600 pb-1 mb-1 text-blue-300">Registration Phase</div>
                                <div><span className="text-gray-400">Opens:</span> {formatDt(event.registrationStart)}</div>
                                <div><span className="text-gray-400">Closes:</span> {formatDt(event.registrationEnd)}</div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
                
                {/* Event Active Block */}
                {event.eventStartDate && event.eventEndDate && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute -translate-y-1/2 h-2 rounded-full cursor-pointer shadow-sm hover:h-2.5 transition-all z-10"
                                style={{ top: '70%', left: `${eventStartPct}%`, width: `${eventWidth}%`, minWidth: MIN_BAR_PX, backgroundColor: COLORS.primary }}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 rounded-full" style={{ borderColor: COLORS.primary }} />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white border-2 rounded-full" style={{ borderColor: COLORS.primary }} />
                                {eventWidthPx > MIN_LABEL_PX && <span className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold tracking-wider" style={{ color: COLORS.primary }}>EVENT LIVE</span>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs">
                                <div className="font-bold border-b border-gray-600 pb-1 mb-1" style={{ color: '#bae0ff' }}>Event Live Phase</div>
                                <div><span className="text-gray-400">Starts:</span> {formatDt(event.eventStartDate)}</div>
                                <div><span className="text-gray-400">Ends:</span> {formatDt(event.eventEndDate)}</div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}
