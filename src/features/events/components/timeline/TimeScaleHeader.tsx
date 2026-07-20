import { TimelineBounds, getPercentage } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    bounds: TimelineBounds;
}

export function TimeScaleHeader({ bounds }: Props) {
    // Generate tick marks
    const ticks: { date: Date; percent: number }[] = [];
    const totalDays = bounds.totalMs / (1000 * 60 * 60 * 24);
    
    // Determine interval based on total duration to prevent overlapping text
    let intervalDays = 1;
    if (totalDays > 60) intervalDays = 14;
    else if (totalDays > 30) intervalDays = 7;
    else if (totalDays > 14) intervalDays = 3;
    
    let current = new Date(bounds.minDate);
    current.setHours(0, 0, 0, 0); // Start at midnight
    
    while (current <= bounds.maxDate) {
        const pct = getPercentage(current.toISOString(), bounds);
        if (pct >= 0 && pct <= 100) {
            ticks.push({ date: new Date(current), percent: pct });
        }
        current.setDate(current.getDate() + intervalDays);
    }

    let lastMonthStr = "";

    return (
        <div className="relative h-12 border-b text-[10px] font-medium text-gray-400 select-none bg-gray-50/50" style={{ borderColor: COLORS.border }}>
            {ticks.map((tick, i) => {
                const monthStr = tick.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                let showMonth = false;
                if (monthStr !== lastMonthStr) {
                    showMonth = true;
                    lastMonthStr = monthStr;
                }

                return (
                    <div 
                        key={i} 
                        className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
                        style={{ left: `${tick.percent}%` }}
                    >
                        {showMonth && (
                            <div className="absolute top-1 left-2 whitespace-nowrap text-gray-800 font-bold text-xs tracking-tight">
                                {monthStr}
                            </div>
                        )}
                        <span className="whitespace-nowrap mt-6 text-gray-600">
                            {tick.date.toLocaleDateString(undefined, { day: '2-digit' })}
                        </span>
                        <div className="w-px bg-gray-300 mt-auto" style={{ height: 6 }} />
                    </div>
                );
            })}
        </div>
    );
}
