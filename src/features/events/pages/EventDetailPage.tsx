import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Star, BookOpen, GitBranch, Users, Shield, UserCheck, CheckCircle, Trophy, Clock } from "lucide-react";
import { COLORS } from "../../../components/shared/UIComponents";
import { OverviewTab } from "../shared/components/OverviewTab";
import { CriteriaTab } from "../components/criteria/EventCriteriaTab";
import { CategoriesTab } from "../components/category/CategoryTab";
import { AssignMentorsTab } from "../components/category/AssignMentorsTab";
import { RoundsTab } from "../components/round/RoundTab";
import { AssignJudgesTab } from "../components/round/AssignJudgesTab";
import { EventResponse } from "../api/eventService";
import { EventTeamsSection } from "../components/EventTeamsSection";
import { EventJudgingApprovalTab } from "../components/judging/EventJudgingApprovalTab";
import { EventLeaderboardsTab } from "../components/judging/EventLeaderboardsTab";
import { CategoryProvider } from "../context/CategoryContext";
import { RoundProvider } from "../context/RoundContext";
import { EventDetailHeader } from "../shared/components/EventDetailHeader";
import { EventCriteriaProvider } from "../context/EventCriteriaContext";
import { ScheduleTab } from "../components/timeline/ScheduleTab";
import { useEventActions } from "../hooks/useEventActions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EVENT_ACTION_CONFIG } from "../constants/eventActions";
import { ApiError } from "@/lib/api/apiClient";

type TabKey = "overview" | "schedule" | "criteria" | "categories" | "rounds" | "teams" | "assign-judges" | "assign-mentors" | "judging-approval" | "leaderboards";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview",        label: "Overview",        icon: <Calendar size={14} /> },
  { key: "schedule",        label: "Schedule",        icon: <Clock size={14} /> },
  { key: "criteria",        label: "Criteria",        icon: <Star size={14} /> },
  { key: "categories",      label: "Categories",      icon: <BookOpen size={14} /> },
  { key: "rounds",          label: "Rounds",          icon: <GitBranch size={14} /> },
  { key: "assign-judges",   label: "Assign Judges",   icon: <Shield size={14} /> },
  { key: "assign-mentors",  label: "Assign Mentors",  icon: <UserCheck size={14} /> },
  { key: "teams",           label: "Team Management", icon: <Users size={14} /> },
  { key: "judging-approval",label: "Judging Approval", icon: <CheckCircle size={14} /> },
  { key: "leaderboards",    label: "Leaderboards",    icon: <Trophy size={14} /> },
];

export function EventDetailPage({ event, onBack, onEdit, onDeleted }: { event: EventResponse; onBack: () => void; onEdit?: () => void; onDeleted?: (id: string) => void; }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Shared state lifted here so all tabs can read/write ──────────────────
  const [currentEvent, setCurrentEvent] = useState(event);
  const [error, setError] = useState("");

  const [totalPrize, setTotalPrize] = useState<{ amount: number; currency: string } | null>(null);

  type ConfirmAction = "publish" | "cancel" | "delete" | null;
  type ConfirmStep = "confirm" | "verify";

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>("confirm");
  const [confirmInput, setConfirmInput] = useState("");

  const [confirmLoading, setConfirmLoading] = useState(false);

  const {
    loading,
    publishEvent,
    cancelEvent,
    deleteEvent,
  } = useEventActions();

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);

    try {
        switch (confirmAction) {
            case "publish": {
                const updatedEvent = await publishEvent(currentEvent.eventId);

                setCurrentEvent(updatedEvent);

                toast.success("Event published successfully.");

                setConfirmAction(null);

                break;
            }
            case "cancel": {
              if (confirmStep === "confirm") {
                setConfirmStep("verify");
                return;
              }
              const updatedEvent = await cancelEvent(currentEvent.eventId);
              setCurrentEvent(updatedEvent);
              toast.success("Event cancelled successfully.");
              setConfirmAction(null);
              break;
            }
            case "delete": {

              await deleteEvent(currentEvent.eventId);

              toast.success("Event deleted successfully.");
              setConfirmAction(null);
              onDeleted?.(currentEvent.eventId);

              break;
            }
        }
    } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
            setError("Operation failed");
        }
    } finally {
        setConfirmLoading(false);
    }
    };

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

  useEffect(() => {
    setCurrentEvent(event);
  }, [event]);

  return (
    <div className="p-6 space-y-6">   
      <EventCriteriaProvider eventId={event.eventId}>

        <CategoryProvider eventId={event.eventId}>
          <RoundProvider eventId={event.eventId}>

            {/* Header */}
            <EventDetailHeader 
              event={currentEvent}
              totalPrize={totalPrize}
              onBack={onBack}

              onPublish={() => {
                setError("");
                setConfirmStep("confirm");
                setConfirmInput("");
                setConfirmAction("publish");
              }}
              onCancel={() => {
                setError("");
                setConfirmStep("confirm");
                setConfirmInput("");
                setConfirmAction("cancel");
              }}
              onDelete={() => {
                setError("");
                setConfirmStep("confirm");
                setConfirmInput("");
                setConfirmAction("delete");
              }}
              onEdit={onEdit}
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
                event={currentEvent} 
                totalPrize={totalPrize}
                onOpenTeamManagement={() => setActiveTab("teams")}
                onEdit={onEdit}
              />
            )}

            {activeTab === "schedule" && (
              <ScheduleTab event={currentEvent} />
            )}

            {activeTab === "criteria" && (
              <CriteriaTab />
            )}

            {activeTab === "categories" && (
              <CategoriesTab />
            )}
        
            {activeTab === "rounds" && (
              <RoundsTab event={currentEvent} />
            )}

            {activeTab === "assign-judges" && (
              <AssignJudgesTab />
            )}

            {activeTab === "assign-mentors" && (
              <AssignMentorsTab />
            )}
          
            {activeTab === "teams" && (
              <EventTeamsSection eventId={currentEvent.eventId} event={currentEvent} />
            )}       
            
            {activeTab === "judging-approval" && (
              <EventJudgingApprovalTab eventId={event.eventId} />
            )}

            {activeTab === "leaderboards" && (
              <EventLeaderboardsTab eventId={event.eventId} />
            )}
            {
              confirmAction && (
                  <ConfirmDialog
                    title={EVENT_ACTION_CONFIG[confirmAction].title}
                    message={EVENT_ACTION_CONFIG[confirmAction].message}
                    confirmText={
                      confirmAction === "cancel" && confirmStep === "confirm"
                        ? "Continue"
                        : EVENT_ACTION_CONFIG[confirmAction].confirmText
                    }
                    confirmVariant={EVENT_ACTION_CONFIG[confirmAction].variant}
                    loading={confirmLoading}
                    error={error}
                    step={
                      confirmAction === "cancel"
                          ? confirmStep
                          : "confirm"
                    }
                    verifyLabel={
                      confirmAction === "cancel"
                          ? "Type the event name to confirm cancellation"
                          : undefined
                    }

                    verifyPlaceholder={
                        confirmAction === "cancel"
                            ? "Enter event name"
                            : undefined
                    }

                    expectedValue={
                        confirmAction === "cancel"
                            ? currentEvent.eventName
                            : undefined
                    }

                    verifyValue={
                        confirmAction === "cancel"
                            ? confirmInput
                            : ""
                    }

                    onVerifyChange={setConfirmInput}
                    onConfirm={handleConfirm}
                    onCancel={() => {
                      setConfirmAction(null);
                      setConfirmStep("confirm");
                      setConfirmInput("");
                      setError("");
                    }}
                  />
              )
            }
          </RoundProvider>
        </CategoryProvider>
      </EventCriteriaProvider> 
    </div>
  );
}
