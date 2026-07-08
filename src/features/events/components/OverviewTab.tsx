import { BookOpen, GitBranch, Star, Users } from "lucide-react";
import { Card, COLORS } from "../../../components/shared/UIComponents";
import { Field, Input } from "../shared/ui/shared";
//import type { EventDetail, EventCriteria, Category } from "./types";
import type { EventResponse } from "../api/eventService";
import type { EventCriteria } from "../types/eventCriteria";
import type { Category } from "../types/category";
import { EventTeamsSummaryCard } from "./EventTeamsSection";

interface Props {
  event: EventResponse;
  eventCriteria: EventCriteria[];
  categories: Category[];
  onOpenTeamManagement: () => void;
}

export function OverviewTab({ event, eventCriteria, categories, onOpenTeamManagement }: Props) {
  //const totalRounds = categories.reduce((s, c) => s + c.rounds.length, 0);
  //const uniqueMentorCount = new Set(categories.flatMap(c => c.mentors.map(m => m.id))).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Event Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Event Name"><Input value={event.eventName} disabled /></Field>
            <Field label="Category"><Input value={categories.map(c => c.categoryName).join(', ') || 'N/A'} disabled /></Field>
            <Field label="Prize"><Input value={totalPrize ? `${totalPrize.amount} ${totalPrize.currency}` : 'N/A'} disabled /></Field>
            <Field label="Status"><Input value={String(event.eventStatusName)} disabled /></Field>
            <Field label="Deadline"><Input value={event.eventEndDate || event.registrationEnd} disabled /></Field>
            <Field label="Teams Registered"><Input value={String(event.teamCount ?? 0)} disabled /></Field>
          </div>
        </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Summary</div>
          {[
            { label: "Categories", value: categories.length, icon: <BookOpen size={14} />, color: COLORS.secondary },
            //{ label: "Rounds", value: totalRounds, icon: <GitBranch size={14} />, color: COLORS.primary },
            //{ label: "Event Criteria", value: eventCriteria.length, icon: <Star size={14} />, color: COLORS.warning },
            //{ label: "Mentors", value: uniqueMentorCount, icon: <Users size={14} />, color: COLORS.success },
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
    </div>
  );
}
