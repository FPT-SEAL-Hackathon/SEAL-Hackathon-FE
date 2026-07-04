import { useEffect, useState } from "react";
import { EventCriteria, ImportCriteriaRequest } from "../types/eventCriteria";
import { eventCriteriaService } from "../service/eventCriteriaService";
import { CriteriaTemplate } from "@/features/criteriaTemplates/types/template";
import { criteriaTemplateService } from "@/features/criteriaTemplates/service/criteriaTemplateService";

export function useEventCriteria(eventId: string) {
    const [eventCriteria, setEventCriteria] = useState<EventCriteria[]>([]);
    const [criteriaTemplates, setCriteriaTemplates] = useState<CriteriaTemplate[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

    const loadCriteriaTemplates = async () => {
        const data = await criteriaTemplateService.getAll();
        setCriteriaTemplates(data);
    };

    const loadEventCriteria = async () => {
        const data = await eventCriteriaService.getCriteriaByEvent(eventId);
        setEventCriteria(data);
    };

    const importCriteria = async (templateIds: ImportCriteriaRequest) => {
        await eventCriteriaService.importCriteria(
            eventId, 
            templateIds
        );

        await loadEventCriteria();

        setSelectedTemplates([]);
    };

    const updateEventCriteria = async () => {};
    const removeEventCriteria = async () => {};

    useEffect(() => {
        loadCriteriaTemplates();
        loadEventCriteria();
    }, [eventId]);

    return {
        criteriaTemplates,
        selectedTemplates,
        setSelectedTemplates,

        eventCriteria,
        loadEventCriteria,
        importCriteria,
        updateEventCriteria,
        removeEventCriteria
    };
}