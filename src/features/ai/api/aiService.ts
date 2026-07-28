import { api } from "@/lib/api/apiClient";

export interface CreateAiKnowledgeRequest {
  eventId: string;
  categoryId?: string;
  questionPattern: string;
  standardAnswer: string;
}

export interface AiKnowledgeResponse {
  id: string;
  eventId: string;
  categoryId?: string;
  questionPattern: string;
  standardAnswer: string;
  mentorId: string;
  mentorName: string;
  createdAt: string;
}

export const aiService = {
  createKnowledge: async (data: CreateAiKnowledgeRequest): Promise<AiKnowledgeResponse> => {
    return api.post("/api/v1/ai-knowledge", data);
  },
  
  getKnowledgeByEvent: async (eventId: string): Promise<AiKnowledgeResponse[]> => {
    return api.get(`/api/v1/ai-knowledge/event/${eventId}`);
  },

  deleteKnowledge: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/ai-knowledge/${id}`);
  }
};
