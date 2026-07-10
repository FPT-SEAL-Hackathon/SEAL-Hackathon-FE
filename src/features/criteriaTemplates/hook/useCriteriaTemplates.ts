import { useEffect, useState } from "react";
import { CriteriaTemplate, TemplateRequest } from "../types/template";
import { criteriaTemplateService } from "../service/criteriaTemplateService";


export function useCriteriaTemplates() {
    const [templates, setTemplates] = useState<CriteriaTemplate[]>([]);

    const loadTemplates = async () => {
        const data = await criteriaTemplateService.getAllActive();
        setTemplates(data);
    }

    const createTemplate = async (body: TemplateRequest) => {
        await criteriaTemplateService.create(body);
        await loadTemplates();
    }

    const updateTemplate = async (templateId: string, body: TemplateRequest) => {
        await criteriaTemplateService.update(templateId, body);
        await loadTemplates();
    }

    const deleteTemplate = async (templateId: string) => {
        await criteriaTemplateService.delete(templateId);
        await loadTemplates();
    }

    useEffect(() => {
        loadTemplates();
    }, []);

    return {
        templates,

        createTemplate, 
        updateTemplate,
        deleteTemplate
    };
}