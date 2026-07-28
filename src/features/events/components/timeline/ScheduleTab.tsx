import { EventResponse } from "../../api/eventService";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { EventTimeline } from "./EventTimeline";

interface Props {
    event: EventResponse;
}

export function ScheduleTab({ event }: Props) {
    const { categories } = useCategoryContext();
    const { roundsByCategory } = useRoundContext();

    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = roundsByCategory 
        ? Object.values(roundsByCategory).flat().filter(Boolean) 
        : [];

    return (
        <div className="p-4 bg-white rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Event Schedule Timeline</h2>
                <p className="text-sm text-gray-500">Visual overview of the entire event duration, registration phases, and round configurations.</p>
            </div>
            
            <EventTimeline 
                event={event}
                categories={safeCategories}
                rounds={safeRounds}
            />
        </div>
    );
}
