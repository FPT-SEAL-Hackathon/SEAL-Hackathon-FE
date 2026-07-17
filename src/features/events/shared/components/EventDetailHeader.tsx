import { ArrowLeft, Edit } from "lucide-react";
import { StatusBadge, COLORS, Button } from "@/components/shared/UIComponents";
import { EventResponse } from "../../api/eventService";
import { useCategoryContext } from "../../context/CategoryContext";

interface Props {
  event: EventResponse;
  totalPrize: {
    amount: number;
    currency: string;
  } | null;
  onBack: () => void;
  onEdit?: () => void;
}

export function EventDetailHeader({
  event,
  totalPrize,
  onBack,
  onEdit,
} : Props) {
  const { categories } = useCategoryContext();

    return (
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
            <h1 style={{ fontWeight: 800, fontSize: 22, color: COLORS.textPrimary }}>{event.eventName}</h1>
            <StatusBadge status={event.eventStatusName as string} />
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {categories.length} categories • Deadline: {event.eventEndDate || "Not set"} • Prize: {totalPrize ? `${totalPrize.amount} ${totalPrize.currency}` : "N/A"}
          </div>
        </div>
      </div>
    )
}