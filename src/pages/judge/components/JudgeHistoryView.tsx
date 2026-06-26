import { Card, SectionHeader, COLORS, StatusBadge } from "@/components/shared/UIComponents";

const scoreHistory = [
  { team: "DevDynamo", title: "AI Task Orchestrator", round: "Round 2", total: 79, innovation: 19, technical: 20, impact: 18, presentation: 22, date: "Nov 28, 2025" },
  { team: "InnovateFPT", title: "Predictive Analytics Bot", round: "Round 2", total: 83, innovation: 21, technical: 22, impact: 20, presentation: 20, date: "Nov 27, 2025" },
  { team: "TechStorm", title: "Autonomous Code Writer", round: "Round 2", total: 77, innovation: 18, technical: 21, impact: 17, presentation: 21, date: "Nov 26, 2025" },
  { team: "FutureForge", title: "AI-Driven Test Generator", round: "Round 2", total: 81, innovation: 20, technical: 21, impact: 19, presentation: 21, date: "Nov 25, 2025" },
  { team: "AlphaCoders", title: "AI Task Manager Pro", round: "Round 1", total: 91, innovation: 24, technical: 23, impact: 22, presentation: 22, date: "Nov 20, 2025" },
];

export function JudgeHistoryView() {
  return (
    <>
      <SectionHeader title="Score History" subtitle="All evaluations you have completed" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Team", "Title", "Round", "Innovation", "Technical", "Impact", "Presentation", "Total", "Date"].map(h => (
                  <th key={h} className="text-left px-3 py-3" style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoreHistory.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < scoreHistory.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <td className="px-3 py-3" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{row.team}</td>
                  <td className="px-3 py-3" style={{ fontSize: 12, color: COLORS.textSecondary, maxWidth: 140 }}>{row.title}</td>
                  <td className="px-3 py-3"><StatusBadge status="completed" /></td>
                  {[row.innovation, row.technical, row.impact, row.presentation].map((v, j) => (
                    <td key={j} className="px-3 py-3" style={{ fontSize: 13, color: COLORS.textSecondary }}>{v}</td>
                  ))}
                  <td className="px-3 py-3">
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.total >= 80 ? COLORS.success : row.total >= 70 ? COLORS.warning : COLORS.error }}>{row.total}</span>
                  </td>
                  <td className="px-3 py-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
