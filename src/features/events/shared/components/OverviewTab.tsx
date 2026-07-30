import { useEffect, useState } from "react";
import { BookOpen, Star, Users, UserCheck, Edit } from "lucide-react";
import { Card, COLORS, Button } from "../../../../components/shared/UIComponents";
import { Field, Input } from "../ui/shared";
import type { EventResponse } from "../../api/eventService";
import type { EventCriteria } from "../../types/eventCriteria";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { EventTeamsSummaryCard, getVisibleEventTeams } from "../../components/EventTeamsSection";
import { useEventCriteriaContext } from "../../context/EventCriteriaContext";

interface Props {
  event: EventResponse;
  totalPrize: { amount: number; currency: string } | null;
  onOpenTeamManagement: () => void;
  onEdit?: () => void;
}

export function OverviewTab({ event, totalPrize, onOpenTeamManagement, onEdit }: Props) {
  
  const { eventCriteria } = useEventCriteriaContext();
  const { categories, categoryMentors } = useCategoryContext();
  const { roundJudges } = useRoundContext();
  const [visibleTeamCount, setVisibleTeamCount] = useState<number | null>(null);
  const formatDateTime = (dateTime?: string | null) => {
    if (!dateTime) return "";

    return dateTime.replace("T", "  ");
  };

  useEffect(() => {
    let cancelled = false;
    setVisibleTeamCount(null);
    getVisibleEventTeams(event.eventId, event)
      .then(teams => {
        if (!cancelled) setVisibleTeamCount(teams.length);
      })
      .catch(() => {
        if (!cancelled) setVisibleTeamCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [event]);

  const mentorCount = new Set(
    Object.values(categoryMentors)
      .flat()
      .map(mentor => mentor.mentorId)
  ).size;

  const judgeCount = new Set(
    Object.values(roundJudges)
      .flat()
      .map(judge => judge.judgeId)
  ).size;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Event Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Event Name"><Input value={event.eventName} disabled /></Field>
            <Field label="Status"><Input value={event.eventStatusName} disabled /></Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <div
                  className="w-full rounded-xl px-3 py-2.5 whitespace-pre-wrap break-words"
                  style={{
                    minHeight: 80, // chỉ là chiều cao tối thiểu
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bg,
                    color: COLORS.textPrimary,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {event.description || (
                    <span style={{ color: COLORS.textSecondary }}>
                      No description
                    </span>
                  )}
                </div>
              </Field>
            </div>
            <Field label="Location"><Input value={event.location} disabled /></Field>
            <Field label="Team Size">
              <Input
                value={
                  event.minTeamSize != null && event.maxTeamSize != null
                    ? `${event.minTeamSize} - ${event.maxTeamSize}`
                    : ""
                }
                disabled
              />
            </Field> 
            <Field label="Registration Start"><Input value={formatDateTime(event.registrationStart)} disabled /></Field>
            <Field label="Registration End"><Input value={formatDateTime(event.registrationEnd)} disabled /></Field>
            <Field label="Event Start"><Input value={formatDateTime(event.eventStartDate)} disabled /></Field>  
            <Field label="Event End"><Input value={formatDateTime(event.eventEndDate)} disabled /></Field>           
            <Field label="Category">
              <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                {categories.length === 0 ? (
                  <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                    No categories
                  </span>
                ) : (
                  <>
                    {categories.slice(0, 3).map(category => (
                      <span
                        key={category.categoryId}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${COLORS.secondary}15`,
                          color: COLORS.secondary,
                          border: `1px solid ${COLORS.secondary}30`,
                        }}
                      >
                        {category.categoryName}
                      </span>
                    ))}

                    {categories.length > 3 && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${COLORS.textSecondary}10`,
                          color: COLORS.textSecondary,
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        +{categories.length - 3}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Field>
          </div>
          {onEdit && (
            <div className="flex justify-end mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <Button variant="primary" size="sm" icon={<Edit size={13} />} onClick={onEdit}>
                Edit Event
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Summary</div>
          {[
            { label: "Categories", value: categories.length, icon: <BookOpen size={14} />, color: COLORS.secondary },
            { label: "Event Criteria", value: eventCriteria.length, icon: <Star size={14} />, color: COLORS.warning },
            { label: "Mentors", value: mentorCount, icon: <Users size={14} />, color: COLORS.success },
            { label: "Judges", value: judgeCount, icon: <UserCheck size={14} />, color: COLORS.primary },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{s.label}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </Card>
        <EventTeamsSummaryCard eventId={event.eventId} event={event} onOpen={onOpenTeamManagement} />
      </div>
    </div>
  );
}
