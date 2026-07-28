import { useState } from "react";
import { EventResponse, eventService } from "../api/eventService";


export function useEventActions() {
    const [loading, setLoading] = useState(false);

    const publishEvent = async (eventId: string) : Promise<EventResponse> => {
        setLoading(true);

        try {
            return await eventService.publishEvent(eventId)
        } catch(err) {
            throw err;
        }
         finally {
            setLoading(false);
        }
    };

    const cancelEvent = async (
        eventId: string
    ): Promise<EventResponse> => {
        setLoading(true);

        try {
        return await eventService.cancelEvent(eventId);
        } finally {
        setLoading(false);
        }
    };
    
    return {
        loading,
        publishEvent,
        cancelEvent,
    };
}