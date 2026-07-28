import { Maximize2 } from "lucide-react";

interface Props {
    onExpand: () => void;
}

// Toolbar timeline: chỉ còn nút "Expand" để xem lịch trình trong modal lớn hơn.
export function TimelineToolbar({ onExpand }: Props) {
    return (
        <div className="flex justify-end items-center mb-3 gap-2">
            <button
                type="button"
                onClick={onExpand}
                title="Expand to view the full schedule"
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            >
                <Maximize2 size={14} />
                <span>Expand</span>
            </button>
        </div>
    );
}
