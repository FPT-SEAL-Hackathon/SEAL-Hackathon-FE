import { useEffect, useState, Children } from "react";
import { ArrowLeft, Calendar, Star, BookOpen, GitBranch, Users } from "lucide-react";
import { StatusBadge, COLORS } from "../../../components/shared/UIComponents";
import { OverviewTab } from "../shared/components/OverviewTab";
import { CriteriaTab } from "../components/criteria/EventCriteriaTab";
import { CategoriesTab } from "../components/category/CategoryTab";
import { RoundsTab } from "../components/round/RoundTab";
import { useEventCriteria } from "../hooks/useEventCriteria";
import { EventResponse } from "../api/eventService";
import { useCategories } from "../hooks/useCategories";
import { useRounds } from "../hooks/useRounds";
import { EventTeamsSection } from "../components/EventTeamsSection";
import { CategoryProvider } from "../context/CategoryContext";
import { RoundProvider } from "../context/RoundContext";
import { EventDetailHeader } from "../shared/components/EventDetailHeader";
import { EventCriteriaProvider, useEventCriteriaContext } from "../context/EventCriteriaContext";

type TabKey = "overview" | "criteria" | "categories" | "rounds" | "teams";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview",    label: "Overview",    icon: <Calendar size={14} /> },
  { key: "criteria",    label: "Criteria",    icon: <Star size={14} /> },
  { key: "categories",  label: "Categories",  icon: <BookOpen size={14} /> },
  { key: "rounds",      label: "Rounds",      icon: <GitBranch size={14} /> },
  { key: "teams",       label: "Team Management", icon: <Users size={14} /> },
];

export function EventDetailPage({ event, onBack }: { event: EventResponse; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Shared state lifted here so all tabs can read/write ──────────────────

  const [totalPrize, setTotalPrize] = useState<{ amount: number; currency: string } | null>(null);

  useEffect(() => {
    import("../../awards/api/awardService").then(({ awardService }) => {
      awardService.getEventPrizeTotal(event.eventId)
        .then(res => {
          if (res.totalPrizes && res.totalPrizes.length > 0) {
            setTotalPrize({ amount: res.totalPrizes[0].totalPrize, currency: res.totalPrizes[0].prizeCurrency });
          }
        })
        .catch(console.error);
    });
  }, [event.eventId]);

  return (
    <div className="p-6 space-y-6">   
      <EventCriteriaProvider eventId={event.eventId}>

        <CategoryProvider eventId={event.eventId}>
          <RoundProvider eventId={event.eventId}>

            {/* Header */}
            <EventDetailHeader 
              event={event}
              totalPrize={totalPrize}
              onBack={onBack}
            />
            {/* Tab bar */}
            <div
              className="flex gap-1 p-1 rounded-2xl"
              style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}`, width: "fit-content" }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-orange-100"
                  style={{
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? 600 : 400,
                    color: activeTab === tab.key ? "#fff" : COLORS.textSecondary,
                    ...(activeTab === tab.key && {
                      background: COLORS.primary, 
                    }),
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
              <OverviewTab 
                event={event} 
                totalPrize={totalPrize}
                onOpenTeamManagement={() => setActiveTab("teams")}
              />
            )}

            {activeTab === "criteria" && (
              <CriteriaTab />
            )}

            {activeTab === "categories" && (
              <CategoriesTab />
            )}
        
            {activeTab === "rounds" && (
              <RoundsTab />
            )}
          
            {activeTab === "teams" && (
              <EventTeamsSection eventId={event.eventId} />
            )}       
          </RoundProvider>
        </CategoryProvider>
      </EventCriteriaProvider> 
    </div>
  );
}
