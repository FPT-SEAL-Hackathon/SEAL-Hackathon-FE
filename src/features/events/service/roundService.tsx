import { api } from "@/lib/api/apiClient";
import { AssignJudgesRequest, ImportEventCriteriaRequest, Round, RoundCriteria, RoundJudge, RoundRequest, UpdateRoundCriterionRequest, Judge } from "../types/round";

export const roundService = {
    create: (
        categoryId: string,
        body: RoundRequest
    ) => api.post<Round>(
        `/api/v1/round/${categoryId}`,
        body
    ),

    getById: (id: string) => api.get<Round>(`/api/v1/round/${id}`),
    getByCategory: (categoryId: string) => api.get<Round[]>(`/api/v1/rounds/${categoryId}`),

    update: (
        id: string,
        body: RoundRequest
    ) => api.put<Round>(
        `/api/v1/round/${id}`,
        body
    ),

    delete: (id: string) => api.delete<void>(`/api/v1/round/${id}`),

    //Round Criteria
    importEventCriteria: (
        id: string,
        body: ImportEventCriteriaRequest
    ) => api.post<RoundCriteria[]>(
        `/api/v1/rounds/criteria/import/${id}`,
        body
    ),
    getCriteriaByRound: (id: string) => api.get<RoundCriteria[]>(`/api/v1/rounds/criteria/${id}`),
    updateRoundCriterion: (
        roundCriterionId: string,
        body: UpdateRoundCriterionRequest
    ) => api.put<RoundCriteria>(
        `/api/v1/rounds/criterion/import/${roundCriterionId}`,
        body
    ),
    deleteRoundCriterion: (roundCriterionId: string) => api.delete<void>(`/api/v1/rounds/criterion/${roundCriterionId}`),

    //Round Judge
    assignJudges: (
        id: string,
        body: AssignJudgesRequest
    ) => api.post<RoundJudge[]>(
        `/api/v1/round/judges/${id}`,
        body
    ),
    getJudgesByRound: (roundId: string) => api.get<RoundJudge[]>(`/api/v1/round/judges/${roundId}`),
    removeJudge: (roundJudgeId: string) => api.delete<void>(`/api/v1/round/judge/${roundJudgeId}`),
    getAllJudges: () => api.get<Judge[]>("/api/v1/users/judges"),
}