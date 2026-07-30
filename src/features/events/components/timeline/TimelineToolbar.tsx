import { Maximize2, Minus, Plus, Scan } from "lucide-react";
import { ZOOM_STEPS } from "./timelineUtils";

interface Props {
    // Bỏ trống khi toolbar đã nằm TRONG modal mở rộng (không cần nút Expand lồng nhau).
    onExpand?: () => void;
    // Mức zoom hiện tại: px cho mỗi ngày, null = "Fit" (vừa khung, không cuộn ngang).
    pxPerDay: number | null;
    onZoomChange: (pxPerDay: number | null) => void;
    className?: string;
}

const BTN_CLASS =
    "flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white";

/**
 * Toolbar timeline: zoom (− / + / Fit) và nút "Expand".
 * Zoom đổi BỀ RỘNG canvas (px mỗi ngày) chứ không đổi khoảng thời gian đang xem — nhờ vậy
 * event dài vẫn xem được tổng thể ở mức thấp, còn round chỉ vài giờ thì zoom lên để đọc.
 * "Fit" đưa canvas về đúng bề rộng khung (trạng thái cũ, không cuộn ngang).
 */
export function TimelineToolbar({ onExpand, pxPerDay, onZoomChange, className = "" }: Props) {
    // Ở chế độ Fit, nhấn − / + bắt đầu từ hai đầu dải zoom cho có phản hồi rõ ràng.
    const currentIndex = pxPerDay == null ? -1 : ZOOM_STEPS.indexOf(pxPerDay);

    const zoomOut = () => {
        if (currentIndex <= 0) {
            onZoomChange(null); // đã ở mức thấp nhất → về Fit
            return;
        }
        onZoomChange(ZOOM_STEPS[currentIndex - 1]);
    };

    const zoomIn = () => {
        if (currentIndex === -1) {
            onZoomChange(ZOOM_STEPS[0]);
            return;
        }
        if (currentIndex >= ZOOM_STEPS.length - 1) return;
        onZoomChange(ZOOM_STEPS[currentIndex + 1]);
    };

    return (
        <div className={`flex justify-end items-center gap-2 ${className}`}>
            <span className="text-[11px] text-gray-400 mr-1">
                {pxPerDay == null ? "Fit to width" : `${pxPerDay}px / day`}
            </span>
            <button type="button" onClick={zoomOut} title="Zoom out" className={BTN_CLASS} disabled={pxPerDay == null}>
                <Minus size={14} />
            </button>
            <button
                type="button"
                onClick={zoomIn}
                title="Zoom in"
                className={BTN_CLASS}
                disabled={currentIndex >= ZOOM_STEPS.length - 1}
            >
                <Plus size={14} />
            </button>
            <button
                type="button"
                onClick={() => onZoomChange(null)}
                title="Fit the whole schedule into the panel"
                className={BTN_CLASS}
                disabled={pxPerDay == null}
            >
                <Scan size={14} />
                <span>Fit</span>
            </button>
            {onExpand && (
                <button
                    type="button"
                    onClick={onExpand}
                    title="Expand to view the full schedule"
                    className={BTN_CLASS}
                >
                    <Maximize2 size={14} />
                    <span>Expand</span>
                </button>
            )}
        </div>
    );
}
