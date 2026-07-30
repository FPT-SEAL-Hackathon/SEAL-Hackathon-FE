import { TimelineBounds, getPercentage } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    bounds: TimelineBounds;
    // Bề rộng thực (px) của track, do TimelineGrid tính từ mức zoom.
    trackPx: number;
}

// Ngưỡng coi tick là "sát mép" để căn nhãn về trong, tránh bị cắt/che ở hai biên.
const EDGE_PCT = 2;
// Khoảng cách px tối thiểu giữa hai vạch để thang không rối.
const MIN_TICK_PX = 28;
// Khoảng cách px tối thiểu giữa hai NHÃN ngày (nhãn rộng hơn vạch).
const MIN_DAY_LABEL_PX = 34;
// Từ mức zoom này (px cho mỗi ngày) mới đủ chỗ hiện thêm thứ trong tuần.
const WEEKDAY_LABEL_PX_PER_DAY = 120;
// Các bước "đẹp" cho khoảng cách vạch (ngày) — tránh mốc kiểu 5/11 ngày khó đọc.
const NICE_INTERVALS = [1, 2, 3, 7, 14, 28];

export function TimeScaleHeader({ bounds, trackPx }: Props) {
    const totalDays = bounds.totalMs / (1000 * 60 * 60 * 24);

    // Mật độ vạch tính theo BỀ RỘNG PX THẬT (phụ thuộc mức zoom) chứ không theo tổng số
    // ngày: zoom sâu thì hiện từng ngày, zoom xa thì tự thưa ra, ở mọi độ dài event.
    const pxPerDay = totalDays > 0 ? trackPx / totalDays : trackPx;
    const rawInterval = Math.max(1, Math.ceil(MIN_TICK_PX / Math.max(pxPerDay, 0.01)));
    const intervalDays = NICE_INTERVALS.find(n => n >= rawInterval) ?? rawInterval;

    // Nhãn ngày chỉ hiện khi cách nhãn trước đủ xa (quy đổi px → %).
    const minDayLabelGapPct = (MIN_DAY_LABEL_PX / Math.max(trackPx, 1)) * 100;
    const showWeekday = pxPerDay >= WEEKDAY_LABEL_PX_PER_DAY;

    // Sinh danh sách tick ngày.
    const ticks: { date: Date; percent: number }[] = [];
    const current = new Date(bounds.minDate);
    current.setHours(0, 0, 0, 0);
    while (current <= bounds.maxDate) {
        const pct = getPercentage(current.toISOString(), bounds);
        if (pct >= 0 && pct <= 100) {
            ticks.push({ date: new Date(current), percent: pct });
        }
        current.setDate(current.getDate() + intervalDays);
    }

    // Nhãn tháng: chỉ lấy tick ĐẦU của mỗi tháng (dải trên). Tháng rộng nên không đè nhau.
    const monthTicks: { label: string; percent: number }[] = [];
    let lastMonthKey = "";
    ticks.forEach(t => {
        const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
        if (key !== lastMonthKey) {
            lastMonthKey = key;
            monthTicks.push({
                label: t.date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
                percent: t.percent,
            });
        }
    });

    // Căn nhãn theo vị trí: sát mép trái → căn trái, sát mép phải → căn phải, còn lại → giữa.
    // Vạch tick luôn ở đúng percent; chỉ NHÃN dịch để không tràn ra ngoài / chui dưới cột nhãn.
    const labelTransform = (percent: number) => {
        if (percent <= EDGE_PCT) return "translateX(0)";
        if (percent >= 100 - EDGE_PCT) return "translateX(-100%)";
        return "translateX(-50%)";
    };

    return (
        <div className="relative h-14 border-b text-[10px] font-medium select-none bg-gray-50/50" style={{ borderColor: COLORS.border }}>
            {/* Dải tháng (trên) */}
            <div className="absolute top-0 left-0 right-0 h-6 border-b" style={{ borderColor: COLORS.border }}>
                {monthTicks.map((m, i) => (
                    <div
                        key={i}
                        className="absolute top-1 whitespace-nowrap text-gray-800 font-bold text-xs tracking-tight px-1"
                        style={{ left: `${m.percent}%`, transform: labelTransform(m.percent) }}
                    >
                        {m.label}
                    </div>
                ))}
            </div>

            {/* Dải ngày (dưới) */}
            <div className="absolute bottom-0 left-0 right-0 h-8">
                {(() => {
                    let lastShownPercent = -Infinity;
                    return ticks.map((tick, i) => {
                        // Chỉ hiện số ngày nếu cách nhãn trước đủ xa; vạch tick vẫn luôn vẽ.
                        const showDay = tick.percent - lastShownPercent >= minDayLabelGapPct;
                        if (showDay) lastShownPercent = tick.percent;
                        return (
                            <div key={i}>
                                {/* Nhãn số ngày — căn mép để không bị che ở hai biên */}
                                {showDay && (
                                    <span
                                        className="absolute top-1 whitespace-nowrap text-gray-600"
                                        style={{ left: `${tick.percent}%`, transform: labelTransform(tick.percent) }}
                                    >
                                        {tick.date.toLocaleDateString(
                                            undefined,
                                            showWeekday ? { weekday: "short", day: "2-digit" } : { day: "2-digit" },
                                        )}
                                    </span>
                                )}
                                {/* Vạch tick — luôn ở đúng vị trí percent */}
                                <div
                                    className="absolute bottom-0 w-px bg-gray-300"
                                    style={{ left: `${tick.percent}%`, height: 6, transform: "translateX(-50%)" }}
                                />
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}
