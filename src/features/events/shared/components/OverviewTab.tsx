import { BookOpen, Star, Users, UserCheck } from "lucide-react";
import { Card, COLORS } from "../../../../components/shared/UIComponents";
import { Field, Input } from "../ui/shared";
import type { EventResponse } from "../../api/eventService";
import type { EventCriteria } from "../../types/eventCriteria";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { EventTeamsSummaryCard } from "../../components/EventTeamsSection";
import { useEventCriteriaContext } from "../../context/EventCriteriaContext";

interface Props {
  event: EventResponse;
  totalPrize: { amount: number; currency: string } | null;
  onOpenTeamManagement: () => void;
}

export function OverviewTab({ event, totalPrize, onOpenTeamManagement }: Props) {
  
  const { eventCriteria } = useEventCriteriaContext();
  const { categories, categoryMentors } = useCategoryContext();
  const { roundJudges } = useRoundContext();

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
            <Field label="Total Prize"><Input value={totalPrize ? `${totalPrize.amount} ${totalPrize.currency}` : 'N/A'} disabled /></Field>
            <Field label="Teams Registered"><Input value={String(event.teamCount ?? 0)} disabled /></Field>
            <Field label="Registration Deadline"><Input value={event.registrationEnd} disabled /></Field>
            <Field label="Event End"><Input value={event.eventEndDate} disabled /></Field>           
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
        <EventTeamsSummaryCard eventId={event.eventId} onOpen={onOpenTeamManagement} />
      </div>
    </div>
  );
}
