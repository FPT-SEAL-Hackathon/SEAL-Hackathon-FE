import { useState } from "react";
import { AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ValidationWarning } from "./timelineUtils";
import { COLORS } from "../../../../components/shared/UIComponents";

interface Props {
    issues: ValidationWarning[];
}

export function TimelineValidation({ issues }: Props) {
    const [expanded, setExpanded] = useState(false);
    
    // Filter out "no rounds" warning as it's displayed inline in the CategoryLane
    const filteredIssues = issues.filter(i => !i.message.includes("has no rounds"));
    if (filteredIssues.length === 0) return null;

    const errors = filteredIssues.filter(i => i.type === 'error').length;
    const warnings = filteredIssues.filter(i => i.type === 'warning').length;

    return (
        <div className="mt-4 border rounded-xl overflow-hidden bg-white shadow-sm" style={{ borderColor: errors > 0 ? COLORS.error + '40' : '#ffd591' }}>
            <div 
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                style={{ backgroundColor: errors > 0 ? COLORS.error + '05' : '#fff7e6' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {errors > 0 ? <XCircle size={18} color={COLORS.error} /> : <AlertTriangle size={18} color="#d46b08" />}
                    <span className="font-semibold text-sm" style={{ color: errors > 0 ? COLORS.error : '#d46b08' }}>
                        {errors > 0 ? `${errors} Error${errors > 1 ? 's' : ''} found` : ''}
                        {errors > 0 && warnings > 0 ? ' and ' : ''}
                        {warnings > 0 ? `${warnings} Warning${warnings > 1 ? 's' : ''} found` : ''}
                    </span>
                </div>
                <div className="text-gray-400">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>
            
            {expanded && (
                <div className="border-t px-4 py-3 flex flex-col gap-2" style={{ borderColor: errors > 0 ? COLORS.error + '20' : '#ffe58f' }}>
                    {filteredIssues.map((issue, idx) => (
                        <div 
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: issue.type === 'error' ? COLORS.error : '#d46b08' }}
                        >
                            <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            <span>{issue.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
