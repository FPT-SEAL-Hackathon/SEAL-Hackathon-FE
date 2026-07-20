import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds, getPercentage, getWidthPercentage } from "./timelineUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";

interface Props {
    round: RoundResponse;
    bounds: TimelineBounds;
}

export function RoundBlock({ round, bounds }: Props) {
    const rStartPct = getPercentage(round.startDate, bounds);
    const rWidth = getWidthPercentage(round.startDate, round.endDate, bounds);
    
    // Sub-bars for Submission and Judging relative to the round block itself
    const sStartPct = round.startDate && round.endDate ? getWidthPercentage(round.startDate, round.submissionDeadline, bounds) / Math.max(rWidth, 0.001) * 100 : 0;
    const sWidth = round.startDate && round.endDate ? getWidthPercentage(round.startDate, round.submissionDeadline, bounds) / Math.max(rWidth, 0.001) * 100 : 0;
    // Wait, submission is from round.startDate to round.submissionDeadline
    // judging is from round.submissionDeadline to round.judgingDeadline
    
    const subStartPct = 0;
    const subWidthPct = (round.startDate && round.submissionDeadline && rWidth > 0) 
        ? (getWidthPercentage(round.startDate, round.submissionDeadline, bounds) / rWidth) * 100 : 0;
        
    const judgeStartPct = subWidthPct;
    const judgeWidthPct = (round.submissionDeadline && round.judgingDeadline && rWidth > 0)
        ? (getWidthPercentage(round.submissionDeadline, round.judgingDeadline, bounds) / rWidth) * 100 : 0;

    const formatDt = (d?: string | null) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "Unknown";

    const tooltipContent = (
        <div className="text-xs">
            <div className="font-bold mb-1">{round.roundName}</div>
            <div>Start: {formatDt(round.startDate)}</div>
            <div>Sub. Deadline: {formatDt(round.submissionDeadline)}</div>
            <div>Judg. Deadline: {formatDt(round.judgingDeadline)}</div>
            <div>End: {formatDt(round.endDate)}</div>
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 h-[42px] rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-[calc(50%+2px)] hover:shadow-md hover:z-10 hover:border-gray-400"
                    style={{ left: `${rStartPct}%`, width: `${rWidth}%` }}
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
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    );
}
