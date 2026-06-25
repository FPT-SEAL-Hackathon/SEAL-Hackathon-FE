import { Star, BarChart2, TrendingUp, Award } from "lucide-react";
import { Card, SectionHeader, COLORS, StatCard, ProgressBar } from "@/components/shared/UIComponents";

// Static mock data for calibration
const calibrationData = [
  { judge: "You (Dr. Pham)", avg: 80.0, min: 77, max: 83, stdDev: 2.1 },
  { judge: "Prof. Nguyen Van A", avg: 78.5, min: 72, max: 85, stdDev: 4.3 },
  { judge: "Dr. Le Thi B", avg: 82.3, min: 78, max: 88, stdDev: 2.8 },
  { judge: "Assoc. Prof. Tran C", avg: 75.1, min: 68, max: 82, stdDev: 5.2 },
  { judge: "Dr. Hoang D", avg: 83.7, min: 79, max: 89, stdDev: 3.1 },
];

export function JudgeCalibrationView() {
  return (
    <>
      <SectionHeader title="Calibration Analytics" subtitle="Compare your scoring patterns with other judges" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Your Avg Score" value="80.0" icon={<Star size={20} />} color={COLORS.primary} />
        <StatCard title="Panel Avg" value="79.9" icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title="Your Std Dev" value="2.1" icon={<TrendingUp size={20} />} color={COLORS.success} />
        <StatCard title="Calibration Score" value="94%" icon={<Award size={20} />} color={COLORS.accent} />
      </div>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Judge Panel Comparison</div>
        <div className="space-y-4">
          {calibrationData.map((j, i) => (
            <div key={j.judge} className="p-4 rounded-xl" style={{ background: i === 0 ? `${COLORS.primary}08` : COLORS.bg, border: `1px solid ${i === 0 ? COLORS.primary + "30" : COLORS.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: 14, color: i === 0 ? COLORS.primary : COLORS.textPrimary }}>
                  {j.judge} {i === 0 && <span style={{ fontSize: 11, marginLeft: 4, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20` }}>You</span>}
                </span>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Range: {j.min}–{j.max}</span>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Std Dev: {j.stdDev}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Avg: {j.avg}</span>
                </div>
              </div>
              <ProgressBar value={j.avg} max={100} color={i === 0 ? COLORS.primary : COLORS.secondary} />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Calibration Insights</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Consistent Scoring", desc: "Your standard deviation of 2.1 is the lowest in the panel, indicating very consistent evaluation.", color: COLORS.success, icon: "✓" },
            { title: "Near Panel Average", desc: "Your average of 80.0 is close to the panel average of 79.9 — well calibrated.", color: COLORS.primary, icon: "≈" },
            { title: "No Outliers Detected", desc: "No extreme scores detected. Your evaluations are within acceptable variance range.", color: COLORS.success, icon: "✓" },
          ].map(insight => (
            <div key={insight.title} className="p-4 rounded-xl" style={{ background: `${insight.color}10`, border: `1px solid ${insight.color}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 18, color: insight.color }}>{insight.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{insight.title}</span>
              </div>
              <p style={{ fontSize: 12, color: COLORS.textSecondary }}>{insight.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
