export interface EventCriteria {
  eventCriterionId: string;
  eventId: string;
  templateId: string;
  criterionName: string;
  description: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ImportCriteriaRequest {
    templateIds: string[];
}

export interface UpdateEventCriteriaRequest {
    weight: number;
    maxScore: number;
}