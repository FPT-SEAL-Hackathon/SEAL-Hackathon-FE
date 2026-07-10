import { api } from "@/lib/api/apiClient";
import { EventCriteria, ImportCriteriaRequest } from "../types/eventCriteria";

export const eventCriteriaService = {
    importCriteria: (
        eventId: string,
        body: ImportCriteriaRequest
    ) => 
        api.post<EventCriteria[]>(
            `/api/v1/event/criteria/import/${eventId}`,
            body
        ),

    getCriteriaByEvent: (eventId: string) => api.get<EventCriteria[]>(`/api/v1/event/criteria/${eventId}`),
 
}