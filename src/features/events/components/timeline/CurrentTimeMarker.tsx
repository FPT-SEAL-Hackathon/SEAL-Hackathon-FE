import { useState, useEffect } from "react";
import { TimelineBounds, getPercentage } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    bounds: TimelineBounds;
}

export function CurrentTimeMarker({ bounds }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const percentage = getPercentage(now.toISOString(), bounds);
    
    // Only show if the current time is within bounds
    if (percentage <= 0 || percentage >= 100) return null;

    return (
        <div 
            className="absolute top-0 bottom-0 z-20 pointer-events-none"
            style={{ 
                left: `${percentage}%`,
                width: 1.5,
                background: COLORS.error, // Red line for current time
            }}
        >
            <div 
                className="absolute top-1 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap uppercase tracking-wider font-bold"
            >
                Now
            </div>
        </div>
    );
}
