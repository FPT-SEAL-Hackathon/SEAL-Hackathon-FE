import { ChevronRight } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, ProgressBar, Button } from "@/components/shared/UIComponents";
import { type RoundResponse } from "@/features/judging/api/roundService";

interface JudgeRoundsViewProps {
  apiRounds: RoundResponse[];
  onSelectRound: (roundId: string) => void;
  onNavigate: (page: string) => void;
}

export function JudgeRoundsView({ apiRounds, onSelectRound, onNavigate }: JudgeRoundsViewProps) {
  return (
    <>
      <SectionHeader title="Assigned Rounds" subtitle="SEAL Fall 2025 — Your evaluation assignments" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apiRounds.length > 0 ? apiRounds.map(r => (
          <Card key={r.roundId} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{r.roundName}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{r.description || "Event Track"}</div>
              </div>
              <StatusBadge status="open" />
            </div>
            <div className="mb-4">
              <ProgressBar value={0} max={1} color={COLORS.primary} label={`Ready for scoring`} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Deadline: {r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleDateString() : "N/A"}</span>
              <Button variant="outline" size="sm" icon={<ChevronRight size={13} />} onClick={() => { onSelectRound(r.roundId); onNavigate("submissions"); }}>
                Score Now
              </Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-2 text-center py-8" style={{ color: COLORS.textSecondary }}>No rounds assigned yet.</div>
        )}
      </div>
      <Card className="p-5 mt-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Your Statistics</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: 28, color: COLORS.primary },
            { label: "Completed", value: 25, color: COLORS.success },
            { label: "Pending", value: 3, color: COLORS.warning },
            { label: "Avg Score Given", value: "80.0", color: COLORS.accent },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}10` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{s.value}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
