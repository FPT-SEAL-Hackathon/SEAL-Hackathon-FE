import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds, getPercentage, getWidthPercentage } from "./timelineUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";

interface Props {
    round: RoundResponse;
    bounds: TimelineBounds;
    // Vị trí dọc (px từ đỉnh track) do CategoryLane tính qua lane-packing để round đè
    // nhau về thời gian không vẽ chồng lên nhau. Bỏ qua => giữ hành vi cũ (giữa track).
    topPx?: number;
    heightPx?: number;
}

export function RoundBlock({ round, bounds, topPx, heightPx = 40 }: Props) {
    const rStartPct = getPercentage(round.startDate, bounds);
    const rWidth = getWidthPercentage(round.startDate, round.endDate, bounds);

    // Các đoạn màu bên trong round block (tính theo % của chính round):
    // Submission: start → submissionDeadline; Judging: submissionDeadline → judgingDeadline;
    // Appeal: appealStartTime → appealEndTime (nằm sau judging theo luật nghiệp vụ).
    const subStartPct = 0;
    const subWidthPct = (round.startDate && round.submissionDeadline && rWidth > 0)
        ? (getWidthPercentage(round.startDate, round.submissionDeadline, bounds) / rWidth) * 100 : 0;

    const judgeStartPct = subWidthPct;
    const judgeWidthPct = (round.submissionDeadline && round.judgingDeadline && rWidth > 0)
        ? (getWidthPercentage(round.submissionDeadline, round.judgingDeadline, bounds) / rWidth) * 100 : 0;

    const appealStartPct = (round.startDate && round.appealStartTime && rWidth > 0)
        ? (getWidthPercentage(round.startDate, round.appealStartTime, bounds) / rWidth) * 100 : 0;
    const appealWidthPct = (round.appealStartTime && round.appealEndTime && rWidth > 0)
        ? (getWidthPercentage(round.appealStartTime, round.appealEndTime, bounds) / rWidth) * 100 : 0;

    const formatDt = (d?: string | null) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "Unknown";

    const hasAppeal = !!(round.appealStartTime && round.appealEndTime);

    const tooltipContent = (
        <div className="text-xs">
            <div className="font-bold mb-1">{round.roundName}</div>
            <div>Start: {formatDt(round.startDate)}</div>
            <div>Sub. Deadline: {formatDt(round.submissionDeadline)}</div>
            <div>Judg. Deadline: {formatDt(round.judgingDeadline)}</div>
            {hasAppeal && <div>Appeal: {formatDt(round.appealStartTime)} → {formatDt(round.appealEndTime)}</div>}
            <div>End: {formatDt(round.endDate)}</div>
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={`absolute rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:z-10 hover:border-gray-400 ${topPx == null ? "top-1/2 -translate-y-1/2" : ""}`}
                    style={{
                        left: `${rStartPct}%`,
                        width: `${rWidth}%`,
                        height: `${heightPx}px`,
                        ...(topPx != null ? { top: `${topPx}px` } : {}),
                    }}
                >
                    {/* Round Label */}
                    <div className="flex-1 px-1.5 pt-1 flex items-start overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-800 truncate leading-tight w-full">
                            {round.roundName}
                        </span>
                    </div>
                    
                    {/* Colored Progress Bars for Submission & Judging */}
                    <div className="mt-auto h-1.5 flex w-full relative bg-gray-100">
                        {subWidthPct > 0 && (
                            <div 
                                className="absolute h-full bg-green-400"
                                style={{ left: `${subStartPct}%`, width: `${subWidthPct}%` }} 
                                title="Submission Period"
                            />
                        )}
                        {judgeWidthPct > 0 && (
                            <div
                                className="absolute h-full bg-purple-400"
                                style={{ left: `${judgeStartPct}%`, width: `${judgeWidthPct}%` }}
                                title="Judging Period"
                            />
                        )}
                        {appealWidthPct > 0 && (
                            <div
                                className="absolute h-full bg-amber-400"
                                style={{ left: `${appealStartPct}%`, width: `${appealWidthPct}%` }}
                                title="Appeal Period"
                            />
                        )}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    );
}
