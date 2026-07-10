import { useEffect, useState } from "react";
import { ImportEventCriteriaRequest, Round, RoundCriteria, RoundRequest, UpdateRoundCriterionRequest, RoundJudge, AssignJudgesRequest, Judge } from "../types/round";
import { roundService } from "../service/roundService";
import { formatDateTime } from "../utils/date";
import { eventCriteriaService } from "../service/eventCriteriaService";
import { EventCriteria } from "../types/eventCriteria";
import { Category } from "../types/category";
import { categoryService } from "../service/categoryService";


export function useRounds(eventId: string) {
    //const [rounds, setRounds] = useState<Round[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [roundsByCategory, setRoundsByCategory] = useState<Record<string, Round[]>>({});
    const [eventCriteria, setEventCriteria] = useState<EventCriteria[]>([]);
    const [roundCriteria, setRoundCriteria] = useState<Record<string, RoundCriteria[]>>({});
    const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
    const [roundJudges, setRoundJudges] = useState<Record<string, RoundJudge[]>>({});

    const loadCategories = async () => {
        const data = await categoryService.getByEvent(eventId);
        setCategories(data);
    }

    const loadRounds = async (categoryId: string) => {
        const data = await roundService.getByCategory(categoryId);
        setRoundsByCategory(prev => ({
            ...prev, 
            [categoryId]: data,
        }))
    };

    const createRound = async (
        categoryId: string,
        body: RoundRequest
    ) => {
        const request: RoundRequest = {
            ...body,
            startDate: formatDateTime(body.startDate),
            endDate: formatDateTime(body.endDate),
            submissionDeadline: formatDateTime(body.submissionDeadline),
            judgingDeadline: formatDateTime(body.judgingDeadline),
        };
        await roundService.create(
            categoryId,
            request
        );
        await loadRounds(categoryId);  
    };

    const updateRound = async (
        categoryId: string,
        roundId: string,
        body: RoundRequest
    ) => {
        const request: RoundRequest = {
            ...body,
            startDate: formatDateTime(body.startDate),
            endDate: formatDateTime(body.endDate),
            submissionDeadline: formatDateTime(body.submissionDeadline),
            judgingDeadline: formatDateTime(body.judgingDeadline),
        };
        await roundService.update(roundId, request);
        await loadRounds(categoryId);
    };

    const deleteRound = async (
        cateogryId: string,
        roundId: string
    ) => {
        await roundService.delete(roundId);
        await loadRounds(cateogryId);
    }

    //Round Criteria
    const loadRoundCriteria = async (roundId: string) => {
        const data = await roundService.getCriteriaByRound(roundId);
        setRoundCriteria(prev => ({
            ...prev,
            [roundId]: data,
        }));
    }

    const loadEventCriteria = async () => {
        const data = await eventCriteriaService.getCriteriaByEvent(eventId);
        setEventCriteria(data);
    }

    const importEventCriteria = async (
        roundId: string,
        body: ImportEventCriteriaRequest
    ) => {
        const data = await roundService.importEventCriteria(
            roundId,
            body
        );
        setRoundCriteria(prev => ({
            ...prev,
            [roundId]: data
        }));
    }

    const updateRoundCriterion = async (
        roundId: string,
        roundCriterionId: string,
        body: UpdateRoundCriterionRequest
    ) => {
        const data = await roundService.updateRoundCriterion(
            roundCriterionId,
            body
        );
        setRoundCriteria(prev => ({
            ...prev,
            [roundId]: prev[roundId].map(c => 
                c.roundCriterionId === roundCriterionId
                ? data : c
            )
        }));
    };

    const removeRoundCriterion = async (
        roundId: string,
        roundCriterionId: string
    ) => {
        await roundService.deleteRoundCriterion(roundCriterionId);
        setRoundCriteria(prev => ({
            ...prev,
            [roundId]: 
            prev[roundId].filter(
                c => c.roundCriterionId !== roundCriterionId
            )
        }));
    }

    //Round Judge

    const loadAvailableJudges = async () => {
        const data = await roundService.getAllJudges();
        setAvailableJudges(data);
    }

    const loadRoundJudges = async (
        roundId: string
    ) => {
        const data = await roundService.getJudgesByRound(roundId);
        setRoundJudges(prev => ({
            ...prev,
            [roundId]: data
        }))
    };

    const assignJudges = async (
        roundId: string,
        body: AssignJudgesRequest
    ) => {
        await roundService.assignJudges(
            roundId,
            body
        );

        await loadRoundJudges(roundId);
    };

    const disableJudge = async (
        roundId: string,
        roundJudgeId: string
    ) => {
        await roundService.disableJudge(roundJudgeId);
        setRoundJudges(prev => ({
            ...prev,
            [roundId]: prev[roundId].filter(judge => 
                judge.roundJudgeId !== roundJudgeId
            )
        }));
    };

    useEffect(() => {
        loadCategories();
        loadEventCriteria();
        loadAvailableJudges();
    }, [eventId]);

    useEffect(() => {
        categories.forEach(category => {
            loadRounds(category.categoryId);
        });
    }, [categories]);

    useEffect(() => {
        Object.values(roundsByCategory)
            .flat()
            .forEach(round => {
                loadRoundCriteria(round.roundId);
                loadRoundJudges(round.roundId);
            });
    }, [roundsByCategory]);

    return {
        roundsByCategory,
        eventCriteria,
        roundCriteria,
        availableJudges,
        roundJudges,

        loadRounds,
        loadEventCriteria,
        loadRoundCriteria,
        loadAvailableJudges,
        loadRoundJudges,

        createRound,
        updateRound,
        deleteRound,

        importEventCriteria,
        updateRoundCriterion,
        removeRoundCriterion,

        assignJudges,
        disableJudge
    };
}