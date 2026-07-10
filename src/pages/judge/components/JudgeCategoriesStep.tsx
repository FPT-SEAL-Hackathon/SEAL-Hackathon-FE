import { CheckCircle2, ChevronRight } from "lucide-react";
import { COLORS, Button } from "@/components/shared/UIComponents";
import { type EventResponse } from "@/features/events/api/eventService";
import { type CategoryResponse } from "@/features/categories/api/categoryService";

interface JudgeCategoriesStepProps {
  event: EventResponse | null;
  categoryGroups: Record<string, { category: CategoryResponse | null, totalRounds: number, completedRounds: number }>;
  mentoredCategoryIds?: Set<string>;
  onSelectCategory: (categoryId: string) => void;
  onBack: () => void;
}

export function JudgeCategoriesStep({ event, categoryGroups, mentoredCategoryIds = new Set(), onSelectCategory, onBack }: JudgeCategoriesStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Events
        </Button>
        <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
          Categories for: {event ? event.eventName : 'General Event'}
        </h2>
      </div>
      
      <div className="flex flex-col gap-4">
        {Object.entries(categoryGroups).map(([catId, data]) => {
          const cat = data.category;
          const isDone = data.totalRounds > 0 && data.completedRounds === data.totalRounds;
          const isMentored = mentoredCategoryIds.has(catId);

          return (
            <div 
              key={catId} 
              className="bg-white rounded-2xl px-6 py-5 border-2 hover:border-primary/30 transition-all cursor-pointer flex flex-row items-center justify-between shadow-sm"
              onClick={() => onSelectCategory(catId)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="inline-block px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider uppercase" style={{ background: `${COLORS.primary}15`, color: COLORS.primary }}>
                    {cat ? cat.categoryName : 'Unknown Category'}
                  </div>
                  {isMentored ? (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded-md text-[10px] font-bold border border-yellow-200 uppercase tracking-wider">
                      Role: Judge & Mentor (Conflicted)
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold border border-indigo-200 uppercase tracking-wider">
                      Role: Judge
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-gray-500">
                  {data.completedRounds} / {data.totalRounds} Rounds Scored
                </span>
                {isDone ? <CheckCircle2 size={24} className="text-green-500" /> : <ChevronRight size={24} className="text-gray-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
