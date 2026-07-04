// import { useEffect } from "react";
// import {
//   ArrowLeft, PlusCircle, Edit, Trash2, Save, X, ChevronDown, ChevronRight,
//   Upload, Users, UserCheck, Star, GitBranch, BookOpen, CheckCircle, AlertTriangle,
//   Calendar, Clock, SlidersHorizontal, Award
// } from "lucide-react";
// import { Card, Button, StatusBadge, COLORS } from "../../../components/shared/UIComponents";
// import { SectionHeader } from "../../../components/shared/UIComponents";
// import { EventResponse } from "../api/eventService";
// import { CreateRoundRequest, CriterionTemplateResponse, RoundFormData, UpdateRoundRequest, criteriaService, roundService } from "@/features/judging/api/roundService";
// import { categoryService, MentorResponse } from "@/features/categories/api/categoryService";
// import { data } from "react-router";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Star, BookOpen, GitBranch } from "lucide-react";
import { StatusBadge, COLORS } from "../../../components/shared/UIComponents";
import { OverviewTab } from "../components/OverviewTab";
import { CriteriaTab } from "../components/criteria/EventCriteriaTab";
import { CategoriesTab } from "../components/category/CategoryTab";
import { RoundsTab } from "../components/round/RoundTab";
import { useEventCriteria } from "../hooks/useEventCriteria";
import { EventResponse } from "../api/eventService";
import { useCategories } from "../hooks/useCategories";
import { useRounds } from "../hooks/useRounds";

type TabKey = "overview" | "criteria" | "categories" | "rounds";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview",    label: "Overview",    icon: <Calendar size={14} /> },
  { key: "criteria",    label: "Criteria",    icon: <Star size={14} /> },
  { key: "categories",  label: "Categories",  icon: <BookOpen size={14} /> },
  { key: "rounds",      label: "Rounds",      icon: <GitBranch size={14} /> },
];

export function EventDetailPage({ event, onBack }: { event: EventResponse; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const {
    criteriaTemplates,
    selectedTemplates,
    setSelectedTemplates,

    eventCriteria,
    loadEventCriteria,
    importCriteria,
    updateEventCriteria,
    removeEventCriteria
  } = useEventCriteria(event.eventId);

  // ── Shared state lifted here so all tabs can read/write ──────────────────

  //const [categories, setCategories] = useState<Category[]>([]);
  const {
    categories, 
    createCategory,
    updateCategory,
    deleteCategory,

    availableMentors,
    assignMentors,
    removeMentor,
    categoryMentors,
    loadCategoryMentors
  } = useCategories(event.eventId);

  const {
    roundsByCategory,
    availableJudges,
  
    loadRounds,
    createRound,
    updateRound,
    deleteRound,

    roundCriteria,
    loadRoundCriteria,
    importEventCriteria,
    updateRoundCriterion,
    removeRoundCriterion,

    roundJudges,
    loadRoundJudges,
    assignJudges,
    removeJudge
  } = useRounds(event.eventId);

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
        });
  }, [roundsByCategory]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors mt-0.5"
          style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontWeight: 800, fontSize: 22, color: COLORS.textPrimary }}>{event.name}</h1>
            <StatusBadge status={event.status} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {event.category} • {event.teams} teams • Deadline: {event.deadline} • Prize: {event.prize}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}`, width: "fit-content" }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#fff" : COLORS.textSecondary,
              background: activeTab === tab.key ? COLORS.primary : "transparent",
              boxShadow: activeTab === tab.key ? `0 2px 12px ${COLORS.primary}40` : "none",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab event={event} eventCriteria={eventCriteria} categories={categories} />
      )}
      {activeTab === "criteria" && (
        <CriteriaTab
          templates={criteriaTemplates}
          eventCriteria={eventCriteria}
          onImport={importCriteria}
          onUpdate={updateEventCriteria}
          onRemove={removeEventCriteria}
        />
      )}
      {activeTab === "categories" && (
        <CategoriesTab
          categories={categories}
          onAdd={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}

          availableMentors={availableMentors}
          categoryMentors={categoryMentors}
          loadCategoryMentors={loadCategoryMentors}
          onAssignMentors={assignMentors}
          onRemoveMentor={removeMentor}
        />
      )}
      {activeTab === "rounds" && (
        <RoundsTab
          categories={categories}
          eventCriteria={eventCriteria}

          roundsByCategory={roundsByCategory}

          onCreateRound={createRound}
          onUpdateRound={updateRound}
          onDeleteRound={deleteRound}

          roundCriteria={roundCriteria}
          onImportEventCriteria={importEventCriteria}
          onUpdateRoundCriterion={updateRoundCriterion}
          onRemoveRoundCriterion={removeRoundCriterion}

          roundJudges={roundJudges}
          availableJudges={availableJudges}
          onAssignJudge={assignJudges}
          onRemoveJudge={removeJudge}
        />
      )}
    </div>
  );
}