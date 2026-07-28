import {
  ArrowLeft,
  Send,
  XCircle,
  Trash2,
  Trophy,
  Calendar,
  BookOpen,
} from "lucide-react";

import {
  StatusBadge,
  COLORS,
  Button,
} from "@/components/shared/UIComponents";

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

  onPublish?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function EventDetailHeader({
  event,
  totalPrize,
  onBack,
  onPublish,
  onCancel,
  onDelete,
}: Props) {
  const { categories } = useCategoryContext();

  const status =
    event.eventStatusName
      ?.trim()
      .toLowerCase();

  const isDraft = status === "draft";

  const canCancel =
    status === "upcoming" ||
    status === "registration open" ||
    status === "registration closed";

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Left */}
      <div className="flex items-start gap-4 flex-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors mt-0.5"
          style={{
            background: "var(--surface-bg)",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textSecondary,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: COLORS.textPrimary,
              }}
            >
              {event.eventName}
            </h1>

            <StatusBadge status={event.eventStatusName} />
          </div>

          <div
            className="flex flex-wrap items-center gap-5"
            style={{
              fontSize: 13,
              color: COLORS.textSecondary,
            }}
          >
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>
                {categories.length} Categories
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span>
                Event Ends:{" "}
                {event.eventEndDate || "Not set"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Trophy size={13} />
              <span>
                Prize:{" "}
                {totalPrize
                  ? `${totalPrize.amount} ${totalPrize.currency}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={<Send size={13} />}
            onClick={onPublish}
          >
            Publish
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<XCircle size={13} />}
            onClick={onCancel}
            style={{
              color: COLORS.warning,
              borderColor: `${COLORS.warning}40`,
            }}
          >
            Cancel Event
          </Button>


          <button
            onClick={onDelete}
            title="Delete Event"
            className="flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              width: 34,
              height: 34,
              border: `1px solid ${COLORS.error}30`,
              background: `${COLORS.error}08`,
              color: COLORS.error,
            }}
          >
            <Trash2 size={15} />
          </button>
   
      </div>
    </div>
  );
}