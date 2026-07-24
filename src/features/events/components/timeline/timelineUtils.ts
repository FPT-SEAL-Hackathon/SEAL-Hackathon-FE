import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";

export interface TimelineBounds {
    minDate: Date;
    maxDate: Date;
    totalMs: number;
}

export function parseSafeDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    
    // For date-only strings (e.g. "2026-07-22"), avoid UTC shift by building a local Date
    if (dateStr.length === 10 && dateStr.indexOf('-') === 4) {
        const [y, m, d] = dateStr.split('-');
        return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    }
    
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

export function calculateTimelineBounds(
    event: EventResponse | null, 
    categories: CategoryResponse[], 
    rounds: RoundResponse[]
): TimelineBounds | null {
    const dates: (Date | null)[] = [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    // Dùng parseSafeDate cho MỌI mốc để biên trục và vị trí bar (getPercentage cũng
    // dùng parseSafeDate) diễn giải timezone giống nhau. Event dates là date-only
    // ("YYYY-MM-DD"): new Date() sẽ hiểu là UTC midnight và lệch ~7h ở UTC+7, khiến
    // thanh Registration/Event Live không khớp trục và round block.
    if (event) {
        dates.push(parseSafeDate(event.registrationStart));
        dates.push(parseSafeDate(event.registrationEnd));
        dates.push(parseSafeDate(event.eventStartDate));
        dates.push(parseSafeDate(event.eventEndDate));
    }

    safeRounds.forEach(r => {
        dates.push(parseSafeDate(r.startDate));
        dates.push(parseSafeDate(r.endDate));
        dates.push(parseSafeDate(r.submissionDeadline));
        dates.push(parseSafeDate(r.judgingDeadline));
    });

    const validDates = dates.filter((d): d is Date => d !== null && !isNaN(d.getTime()));
    
    if (validDates.length === 0) return null;
    
    let minTime = Math.min(...validDates.map(d => d.getTime()));
    let maxTime = Math.max(...validDates.map(d => d.getTime()));
    
    // Add 5% padding to left and right
    const diff = maxTime - minTime;
    if (diff > 0) {
        minTime -= diff * 0.05;
        maxTime += diff * 0.05;
    } else {
        // Fallback for single date
        minTime -= 86400000;
        maxTime += 86400000;
    }
    
    return {
        minDate: new Date(minTime),
        maxDate: new Date(maxTime),
        totalMs: maxTime - minTime
    };
}

export function getPercentage(dateStr: string | null | undefined, bounds: TimelineBounds | null): number {
    if (!bounds || !dateStr) return 0;
    const d = parseSafeDate(dateStr);
    if (!d) return 0;
    
    const p = ((d.getTime() - bounds.minDate.getTime()) / bounds.totalMs) * 100;
    return Math.max(0, Math.min(100, p));
}

export function getWidthPercentage(startStr: string | null | undefined, endStr: string | null | undefined, bounds: TimelineBounds | null): number {
    if (!bounds || !startStr || !endStr) return 0;
    const s = getPercentage(startStr, bounds);
    const e = getPercentage(endStr, bounds);
    return Math.max(0, e - s);
}

/**
 * Xếp các round vào nhiều "dòng con" để round có khoảng thời gian đè nhau không vẽ
 * chồng lên nhau trên cùng một dòng (interval/lane packing).
 * Thuật toán: sort theo % bắt đầu, gán mỗi round vào dòng đầu tiên mà round cuối của
 * dòng đó đã kết thúc (có chừa MIN_GAP_PCT để nhãn không dính sát nhau).
 * Trả về map roundId -> rowIndex và tổng số dòng.
 */
export function assignRoundRows(
    rounds: RoundResponse[],
    bounds: TimelineBounds | null,
): { rowByRoundId: Record<string, number>; rowCount: number } {
    const MIN_GAP_PCT = 0.5; // khoảng hở tối thiểu (%) giữa 2 block cùng dòng
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    const items = safeRounds
        .map(r => {
            const start = getPercentage(r.startDate, bounds);
            const width = getWidthPercentage(r.startDate, r.endDate, bounds);
            return { id: r.roundId, start, end: start + Math.max(width, 0) };
        })
        .sort((a, b) => a.start - b.start);

    const rowEnds: number[] = []; // % kết thúc của block cuối trên mỗi dòng
    const rowByRoundId: Record<string, number> = {};

    for (const item of items) {
        let placed = -1;
        for (let row = 0; row < rowEnds.length; row++) {
            if (item.start >= rowEnds[row] + MIN_GAP_PCT) {
                placed = row;
                break;
            }
        }
        if (placed === -1) {
            placed = rowEnds.length;
            rowEnds.push(item.end);
        } else {
            rowEnds[placed] = item.end;
        }
        rowByRoundId[item.id] = placed;
    }

    return { rowByRoundId, rowCount: Math.max(rowEnds.length, 1) };
}

export interface ValidationWarning {
    type: "error" | "warning";
    message: string;
}

export function validateTimeline(event: EventResponse | null, categories: CategoryResponse[], rounds: RoundResponse[]): ValidationWarning[] {
    const issues: ValidationWarning[] = [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeRounds = Array.isArray(rounds) ? rounds : [];

    if (!event) return issues;
    
    const rs = parseSafeDate(event.registrationStart);
    const re = parseSafeDate(event.registrationEnd);
    const es = parseSafeDate(event.eventStartDate);
    const ee = parseSafeDate(event.eventEndDate);
    
    if (rs && re && rs > re) {
        issues.push({ type: "error", message: "Registration End is before Registration Start." });
    }
    if (es && ee && es > ee) {
        issues.push({ type: "error", message: "Event End is before Event Start." });
    }
    if (re && es && re > es) {
        issues.push({ type: "warning", message: "Registration stays open after the Event has started." });
    }
    
    if (safeCategories.length === 0) {
        issues.push({ type: "warning", message: "Event has no categories yet." });
    }
    
    safeCategories.forEach(cat => {
        const catRounds = safeRounds.filter(r => r.categoryId === cat.categoryId).sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));
        if (catRounds.length === 0) {
            issues.push({ type: "warning", message: `Category '${cat.categoryName}' has no rounds.` });
        } else {
            for (let i = 0; i < catRounds.length - 1; i++) {
                const cur = catRounds[i];
                const nxt = catRounds[i + 1];
                const cEnd = parseSafeDate(cur.endDate);
                const nStart = parseSafeDate(nxt.startDate);
                if (cEnd && nStart && cEnd > nStart) {
                    issues.push({ type: "error", message: `Round '${nxt.roundName}' starts before Round '${cur.roundName}' ends.` });
                }
            }
        }
    });

    safeRounds.forEach(r => {
        const rS = parseSafeDate(r.startDate);
        const sD = parseSafeDate(r.submissionDeadline);
        const jD = parseSafeDate(r.judgingDeadline);
        const rE = parseSafeDate(r.endDate);
        
        if (rS && rE && rS > rE) {
            issues.push({ type: "error", message: `Round '${r.roundName}' End is before Start.` });
        }
        if (rS && sD && sD < rS) {
            issues.push({ type: "error", message: `Submission Deadline for '${r.roundName}' is before its Start Date.` });
        }
        if (sD && jD && jD < sD) {
            issues.push({ type: "error", message: `Judging Deadline for '${r.roundName}' is before Submission Deadline.` });
        }
        if (jD && rE && rE < jD) {
            issues.push({ type: "error", message: `Round '${r.roundName}' ends before Judging Deadline.` });
        }
        
        // Out of bounds check
        if (rS && es && rS < es) {
            issues.push({ type: "error", message: `Round '${r.roundName}' starts before the Event starts.` });
        }
        if (rE && ee && rE > ee) {
            issues.push({ type: "error", message: `Round '${r.roundName}' ends after the Event ends.` });
        }
    });
    
    return issues;
}
