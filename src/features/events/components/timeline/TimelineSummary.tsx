import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";

interface Props {
    event: EventResponse | null;
    categories: CategoryResponse[];
    rounds: RoundResponse[];
}

export function TimelineSummary({ event, categories, rounds }: Props) {
    if (!event) return null;

    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    const formatDt = (d?: string | null) => {
        if (!d) return "TBD";
        return new Date(d).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate current phase
    const now = new Date();
    let phase = "Upcoming";
    let countdown = "";

    const eStart = event.eventStartDate ? new Date(event.eventStartDate) : null;
    const eEnd = event.eventEndDate ? new Date(event.eventEndDate) : null;
    const rStart = event.registrationStart ? new Date(event.registrationStart) : null;
    const rEnd = event.registrationEnd ? new Date(event.registrationEnd) : null;

    const getDiffText = (target: Date) => {
        const diffMs = target.getTime() - now.getTime();
        if (diffMs <= 0) return "";
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days} days ${hours} hours`;
        if (hours > 0) return `${hours} hours`;
        return "Less than an hour";
    };

    if (eEnd && now > eEnd) {
        phase = "Event Ended";
    } else if (eStart && now >= eStart) {
        phase = "Event Live";
        countdown = `Ends in ${getDiffText(eEnd!)}`;
    } else if (rEnd && now > rEnd) {
        phase = "Registration Closed";
        if (eStart) countdown = `Event starts in ${getDiffText(eStart)}`;
    } else if (rStart && now >= rStart) {
        phase = "Registration Open";
        if (rEnd) countdown = `Registration closes in ${getDiffText(rEnd)}`;
    } else if (rStart && now < rStart) {
        countdown = `Registration starts in ${getDiffText(rStart)}`;
    }

    return (
        <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Event Schedule</h3>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-800">
                        {formatDt(event.eventStartDate)} – {formatDt(event.eventEndDate)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                        <span className="font-semibold text-blue-600">{phase}</span>
                        {countdown && <span className="text-gray-500"> · {countdown}</span>}
                    </span>
                </div>
            </div>
            <div className="flex gap-4 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <div>
                    <span className="font-bold text-gray-700">{safeCategories.length}</span> Categories
                </div>
                <div className="w-px bg-gray-200" />
                <div>
                    <span className="font-bold text-gray-700">{safeRounds.length}</span> Rounds
                </div>
            </div>
        </div>
    );
}
