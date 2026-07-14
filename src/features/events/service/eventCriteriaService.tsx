import { api } from "@/lib/api/apiClient";
import { EventCriteria, ImportCriteriaRequest, UpdateEventCriteriaRequest } from "../types/eventCriteria";

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

    update: (
        id: string,
        body: UpdateEventCriteriaRequest
    ) => api.put<EventCriteria>(
        `/api/v1/event/criteria/${id}`,
        body
    ),

    remove: (id: string) => api.delete<void>(`/api/v1/event/criteria/${id}`),
 
}