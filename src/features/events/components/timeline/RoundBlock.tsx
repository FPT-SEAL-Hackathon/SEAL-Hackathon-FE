import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds, getPercentage, getWidthPercentage } from "./timelineUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/tooltip";

interface Props {
    round: RoundResponse;
    bounds: TimelineBounds;
    // Bề rộng thực (px) của track, do TimelineGrid tính từ mức zoom.
    trackPx: number;
    // Vị trí dọc (px từ đỉnh track) do CategoryLane tính qua lane-packing để round đè
    // nhau về thời gian không vẽ chồng lên nhau. Bỏ qua => giữ hành vi cũ (giữa track).
    topPx?: number;
    heightPx?: number;
}

// Bề rộng px tối thiểu để tên round còn đọc được BÊN TRONG block.
const MIN_INNER_LABEL_PX = 72;
// Round chỉ dài vài giờ vẫn phải là một khối bấm/hover được, không co về 0px.
const MIN_BLOCK_PX = 6;

export function RoundBlock({ round, bounds, trackPx, topPx, heightPx = 40 }: Props) {
    const rStartPct = getPercentage(round.startDate, bounds);
    const rWidth = getWidthPercentage(round.startDate, round.endDate, bounds);

    // Block quá hẹp thì tên round bị `truncate` mất sạch → đẩy tên ra thành nhãn nổi
    // bên cạnh block. Quyết định theo px thật nên tự đổi khi user zoom.
    const widthPx = (rWidth / 100) * trackPx;
    const labelInside = widthPx >= MIN_INNER_LABEL_PX;
    // Block sát mép phải: nhãn nổi đặt bên trái để không bị cắt khỏi vùng cuộn.
    const labelOnLeft = rStartPct > 80;

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
                    className={`absolute cursor-pointer transition-all hover:z-10 ${topPx == null ? "top-1/2 -translate-y-1/2" : ""}`}
                    style={{
                        left: `${rStartPct}%`,
                        width: `${rWidth}%`,
                        minWidth: MIN_BLOCK_PX,
                        height: `${heightPx}px`,
                        ...(topPx != null ? { top: `${topPx}px` } : {}),
                    }}
                >
                    {/* Khối màu: overflow-hidden để dải màu không tràn khỏi góc bo. Nhãn nổi
                        nằm NGOÀI khối này nên không bị cắt. */}
                    <div className="w-full h-full rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-gray-400">
                        {labelInside && (
                            <div className="flex-1 px-1.5 pt-1 flex items-start overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-800 truncate leading-tight w-full">
                                    {round.roundName}
                                </span>
                            </div>
                        )}

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

                    {/* Block quá hẹp: tên round hiện thành nhãn nổi cạnh block để vẫn đọc được */}
                    {!labelInside && (
                        <span
                            className={`absolute top-0 whitespace-nowrap text-[10px] font-bold text-gray-700 leading-tight pointer-events-none ${labelOnLeft ? "right-full mr-1" : "left-full ml-1"}`}
                        >
                            {round.roundName}
                        </span>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {tooltipContent}
            </TooltipContent>
        </Tooltip>
    );
}
