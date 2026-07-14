import { createContext, ReactNode, useContext } from "react";
import { useEventCriteria } from "../hooks/useEventCriteria";


type EventCriteriaContextType = ReturnType<typeof useEventCriteria>;

const EventCriteriaContext = createContext<EventCriteriaContextType | null>(null);

interface EventCriteriaProviderProps {
    eventId: string;
    children: ReactNode;
}

export function EventCriteriaProvider({
    eventId,
    children
} : EventCriteriaProviderProps) {

    const value = useEventCriteria(eventId);

    return (
        <EventCriteriaContext.Provider value={value}>
            {children}
        </EventCriteriaContext.Provider>
    )
}

export function useEventCriteriaContext() {
    const context = useContext(EventCriteriaContext);
        if (!context) {
            throw new Error("useEventCriteriaContext must be used in EventCriteriaProvider");
        }
        return context;
}