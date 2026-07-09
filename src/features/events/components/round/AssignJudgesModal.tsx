import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { X } from "lucide-react";

export function AssignJudgesModal<T extends { judgeId: string; fullName: string; email: string; phone: string }>({
  title, allPeople, assignedIds, onAssign, onRemove, onClose,
}: {
  title: string;
  allPeople: T[];
  assignedIds: string[];
  onAssign: (p: T) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const assignedIdsSet = new Set(assignedIds);
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", zIndex: 100 }}>
      <Card className="p-6 w-full max-w-md" style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{title}</span>
          <button onClick={onClose}><X size={16} style={{ color: COLORS.textSecondary }} /></button>
        </div>
        <div className="space-y-2">
          {allPeople.map(p => {
            const isAssigned = assignedIdsSet.has(p.judgeId);
            return (
              <div key={p.judgeId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--surface-bg)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.fullName}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{p.email}</div>
                </div>
                {isAssigned
                  ? <Button variant="danger" size="sm" onClick={() => onRemove(p.judgeId)}>Remove</Button>
                  : <Button variant="primary" size="sm" onClick={() => onAssign(p)}>Assign</Button>}
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
}