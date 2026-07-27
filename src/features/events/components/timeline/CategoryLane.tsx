import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds, assignRoundRows } from "./timelineUtils";
import { RoundBlock } from "./RoundBlock";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    category: CategoryResponse;
    rounds: RoundResponse[];
    bounds: TimelineBounds;
}

// Kích thước một dòng con của round trong lane. Lane cao = rowCount * ROW_STRIDE + đệm.
const BLOCK_H = 40;
const ROW_GAP = 8;
const ROW_STRIDE = BLOCK_H + ROW_GAP;
const LANE_PAD_Y = 10;

export function CategoryLane({ category, rounds, bounds }: Props) {
    // Sort rounds by roundOrder
    const sortedRounds = [...rounds].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));

    // Lane-packing: round đè nhau về thời gian được đẩy xuống dòng con khác nhau,
    // nên chiều cao lane co giãn theo số dòng thực tế thay vì cố định 64px.
    const { rowByRoundId, rowCount } = assignRoundRows(sortedRounds, bounds);
    const trackHeight = rowCount * ROW_STRIDE - ROW_GAP;
    const laneMinHeight = sortedRounds.length === 0 ? 48 : trackHeight + LANE_PAD_Y * 2;

    return (
        <div className="relative flex border-b transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.border, minHeight: `${laneMinHeight}px` }}>
            {/* Label — dính (sticky) khi kéo ngang để luôn thấy tên category */}
            <div className="w-48 shrink-0 px-4 flex flex-col justify-center border-r sticky left-0 z-30 bg-white" style={{ borderColor: COLORS.border }}>
                <span className="font-semibold text-sm truncate" style={{ color: COLORS.textPrimary }} title={category.categoryName}>
                    {category.categoryName}
                </span>
                <span className="text-[10px] text-gray-400">
                    {sortedRounds.length} Rounds
                </span>
            </div>

            {/* Track */}
            <div className="relative flex-1 rounded-md" style={{ backgroundColor: 'transparent', minHeight: `${laneMinHeight}px` }}>
                {sortedRounds.length > 0 ? (
                    <div className="absolute left-0 right-0" style={{ top: `${LANE_PAD_Y}px`, height: `${trackHeight}px` }}>
                        {sortedRounds.map(r => (
                            <RoundBlock
                                key={r.roundId}
                                round={r}
                                bounds={bounds}
                                topPx={(rowByRoundId[r.roundId] ?? 0) * ROW_STRIDE}
                                heightPx={BLOCK_H}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-200">
                            ⚠ No rounds configured
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
