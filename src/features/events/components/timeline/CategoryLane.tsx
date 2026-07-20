import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { TimelineBounds } from "./timelineUtils";
import { RoundBlock } from "./RoundBlock";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    category: CategoryResponse;
    rounds: RoundResponse[];
    bounds: TimelineBounds;
}

export function CategoryLane({ category, rounds, bounds }: Props) {
    // Sort rounds by roundOrder
    const sortedRounds = [...rounds].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));

    return (
        <div className="relative py-2 flex border-b transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.border, minHeight: sortedRounds.length === 0 ? '48px' : '64px' }}>
            {/* Label */}
            <div className="w-48 shrink-0 px-4 flex flex-col justify-center border-r" style={{ borderColor: COLORS.border }}>
                <span className="font-semibold text-sm truncate" style={{ color: COLORS.textPrimary }} title={category.categoryName}>
                    {category.categoryName}
                </span>
                <span className="text-[10px] text-gray-400">
                    {sortedRounds.length} Rounds
                </span>
            </div>
            
            {/* Track */}
            <div className="relative flex-1 h-full rounded-md" style={{ backgroundColor: 'transparent' }}>
                {/* Dotted line to show the span of the category if there are rounds */}
                {sortedRounds.length > 0 ? (
                    <>
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-300 -translate-y-1/2 z-0" />
                        {sortedRounds.map(r => (
                            <RoundBlock key={r.roundId} round={r} bounds={bounds} />
                        ))}
                    </>
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
