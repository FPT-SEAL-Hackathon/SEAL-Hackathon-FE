import { COLORS } from "../../../../components/shared/UIComponents";

export function TimelineLegend() {
    return (
        <div className="flex flex-wrap items-center gap-5 text-[11px] text-gray-600 mt-4 px-2 py-3 bg-gray-50/50 rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-800 uppercase tracking-wider text-[10px]">Legend</span>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-400 rounded-sm shadow-sm" /> 
                <span>Registration</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: COLORS.primary }} /> 
                <span>Event Active</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-400 rounded-sm shadow-sm" /> 
                <span>Submission</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-400 rounded-sm shadow-sm" /> 
                <span>Judging</span>
            </div>
        </div>
    );
}
