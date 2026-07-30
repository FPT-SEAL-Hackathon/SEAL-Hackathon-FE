import { TimelineBounds, getPercentage, parseSafeDate } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";

export interface DraftMarker {
    // Nhãn ngắn hiện cạnh đường mốc (vd "Start", "Submission").
    label: string;
    // Chuỗi ngày-giờ đang nhập trong form ("" hoặc null khi user chưa điền).
    at?: string | null;
    color: string;
}

export interface DraftRange {
    start?: string | null;
    end?: string | null;
}

interface Props {
    bounds: TimelineBounds;
    markers?: DraftMarker[];
    range?: DraftRange;
}

/**
 * Lớp phủ hiển thị mốc thời gian của round ĐANG ĐƯỢC SOẠN trong RoundForm.
 * Khác với RoundBlock (chỉ vẽ khi round đã có đủ cặp start/end), lớp này vẽ TỪNG mốc
 * ngay khi user điền một field — nên nhập dở vẫn thấy được vị trí trên trục thời gian.
 * Đặt trong cùng lớp phủ với CurrentTimeMarker nên tự trải suốt chiều cao các lane.
 */
export function DraftOverlay({ bounds, markers, range }: Props) {
    const hasRange = !!(range?.start && range?.end);
    const rangeStartPct = hasRange ? getPercentage(range!.start, bounds) : 0;
    const rangeEndPct = hasRange ? getPercentage(range!.end, bounds) : 0;
    const rangeWidthPct = Math.max(rangeEndPct - rangeStartPct, 0);

    // Chỉ giữ mốc có giá trị hợp lệ; mốc rỗng/sai định dạng bị bỏ qua thay vì vẽ ở 0%.
    const visibleMarkers = (markers ?? [])
        .filter(m => !!m.at && !!parseSafeDate(m.at))
        .map(m => ({ ...m, percent: getPercentage(m.at, bounds) }));

    if (!hasRange && visibleMarkers.length === 0) return null;

    return (
        <>
            {/* Dải nền mờ cho khoảng [start, end] đang soạn */}
            {hasRange && rangeWidthPct > 0 && (
                <div
                    className="absolute top-0 bottom-0 z-10 pointer-events-none"
                    style={{
                        left: `${rangeStartPct}%`,
                        width: `${rangeWidthPct}%`,
                        background: `${COLORS.primary}14`,
                        borderLeft: `1px dashed ${COLORS.primary}`,
                        borderRight: `1px dashed ${COLORS.primary}`,
                    }}
                />
            )}

            {/* Đường gạch chấm + nhãn cho từng mốc đang nhập */}
            {visibleMarkers.map((m, i) => (
                <div
                    key={`${m.label}-${i}`}
                    className="absolute top-0 bottom-0 z-10 pointer-events-none"
                    style={{
                        left: `${m.percent}%`,
                        borderLeft: `1.5px dashed ${m.color}`,
                    }}
                >
                    {/* Nhãn xếp so le theo chỉ số để các mốc gần nhau không đè chữ lên nhau.
                        Sát mép phải thì đẩy nhãn sang trái để không bị cắt. */}
                    <span
                        className="absolute whitespace-nowrap text-[9px] font-bold px-1 py-0.5 rounded shadow-sm bg-white"
                        style={{
                            top: 6 + (i % 3) * 14,
                            color: m.color,
                            border: `1px solid ${m.color}`,
                            ...(m.percent > 85
                                ? { right: 2, transform: "translateX(0)" }
                                : { left: 2 }),
                        }}
                    >
                        {m.label}
                    </span>
                </div>
            ))}
        </>
    );
}
