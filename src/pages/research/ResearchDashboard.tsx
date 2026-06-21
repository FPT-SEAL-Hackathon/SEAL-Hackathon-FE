import { useState } from "react";
import { useLanguage } from "@/store/languageStore";
import {
  Activity, BarChart2, TrendingUp, Users, Download,
  FileText, PieChart, CheckCircle, AlertCircle
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, DataTable
} from "@/components/shared/UIComponents";

// ===== DATA =====

const judges = [
  { name: "Dr. Pham Thi Lan", shortName: "Pham", avgScore: 80.0, variance: 4.4, stdDev: 2.1, submissions: 18, minScore: 77, maxScore: 83 },
  { name: "Prof. Nguyen Van A", shortName: "Nguyen", avgScore: 78.5, variance: 18.5, stdDev: 4.3, submissions: 17, minScore: 72, maxScore: 85 },
  { name: "Dr. Le Thi Bich", shortName: "Le", avgScore: 82.3, variance: 7.8, stdDev: 2.8, submissions: 18, minScore: 78, maxScore: 88 },
  { name: "Assoc. Prof. Tran C", shortName: "Tran", avgScore: 75.1, variance: 27.0, stdDev: 5.2, submissions: 16, minScore: 68, maxScore: 82 },
  { name: "Dr. Hoang Van D", shortName: "Hoang", avgScore: 83.7, variance: 9.6, stdDev: 3.1, submissions: 18, minScore: 79, maxScore: 89 },
];

const scoreDistributionData = [
  { range: "60–64", count: 3 },
  { range: "65–69", count: 5 },
  { range: "70–74", count: 8 },
  { range: "75–79", count: 15 },
  { range: "80–84", count: 22 },
  { range: "85–89", count: 18 },
  { range: "90–94", count: 9 },
  { range: "95–100", count: 4 },
];

const pieData = [
  { name: "Below Average (<70)", value: 8, color: COLORS.error },
  { name: "Average (70–79)", value: 23, color: COLORS.warning },
  { name: "Above Average (80–89)", value: 40, color: COLORS.primary },
  { name: "Exceptional (90+)", value: 13, color: COLORS.success },
];

const reliabilityData = [
  { round: "R1 Q1-15", icc: 0.82, kripp: 0.78, pearson: 0.86 },
  { round: "R1 Q16-30", icc: 0.85, kripp: 0.81, pearson: 0.88 },
  { round: "R1 Q31-45", icc: 0.79, kripp: 0.75, pearson: 0.83 },
  { round: "R2 F1-10", icc: 0.88, kripp: 0.84, pearson: 0.91 },
  { round: "R2 F11-20", icc: 0.90, kripp: 0.87, pearson: 0.93 },
];

const comparisonData = [
  { criterion: "Innovation", Pham: 79, Nguyen: 77, Le: 82, Tran: 74, Hoang: 84 },
  { criterion: "Technical",  Pham: 81, Nguyen: 80, Le: 83, Tran: 76, Hoang: 85 },
  { criterion: "Impact",     Pham: 80, Nguyen: 78, Le: 82, Tran: 75, Hoang: 83 },
  { criterion: "Presentation", Pham: 80, Nguyen: 79, Le: 82, Tran: 76, Hoang: 83 },
];

const researchStats = {
  icc: 0.84,
  krippendorff: 0.81,
  avgPearson: 0.88,
  panelVariance: 13.4,
  outlierTeams: 3,
  flaggedJudges: 1,
};

const chartColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.success];
const GRID = "rgba(150,100,50,0.15)";
const TICK = "#9a7050";

// ===== CUSTOM SVG CHART COMPONENTS =====

function SvgBarChart({ data, keys, colors, height = 240, yMin = 0, yMax }: {
  data: Record<string, any>[];
  keys: { dataKey: string; label: string; color: string }[];
  colors?: string[];
  height?: number;
  yMin?: number;
  yMax?: number;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: Record<string, any> } | null>(null);
  const padL = 40, padR = 16, padT = 16, padB = 36;
  const W = 500;
  const H = height;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxVal = yMax ?? Math.max(...data.flatMap(d => keys.map(k => Number(d[k.dataKey]) || 0))) * 1.15;
  const minVal = yMin;
  const range = maxVal - minVal || 1;
  const groupW = innerW / data.length;
  const barW = Math.min(20, (groupW / keys.length) - 4);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minVal + t * range);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        {/* grid lines */}
        {yTicks.map((v, i) => {
          const y = padT + innerH - ((v - minVal) / range) * innerH;
          return (
            <g key={`grid-${i}`}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={GRID} strokeDasharray="4 4" />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={10} fill={TICK}>{v % 1 === 0 ? v : v.toFixed(2)}</text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, di) => {
          const groupX = padL + di * groupW + groupW / 2;
          return (
            <g key={`group-${di}`}
              onMouseMove={e => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, item: d });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "pointer" }}
            >
              {keys.map((k, ki) => {
                const val = Number(d[k.dataKey]) || 0;
                const barH = ((val - minVal) / range) * innerH;
                const x = groupX - (keys.length * barW) / 2 + ki * barW;
                const y = padT + innerH - barH;
                return (
                  <rect key={`bar-${di}-${ki}`} x={x} y={y} width={barW - 2} height={Math.max(0, barH)}
                    fill={k.color} rx={3} opacity={0.9} />
                );
              })}
              <text x={groupX} y={H - padB + 14} textAnchor="middle" fontSize={10} fill={TICK}>
                {String(d.judge ?? d.criterion ?? d.range ?? di)}
              </text>
            </g>
          );
        })}
        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke={GRID} />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={GRID} />
      </svg>
      {/* tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute", left: tooltip.x + 10, top: tooltip.y - 10, pointerEvents: "none",
          background: "var(--panel-surface)", backdropFilter: "blur(20px)",
          border: "1px solid var(--glass-border-subtle)", borderRadius: 10, padding: "6px 12px",
          boxShadow: "var(--glass-shadow)", zIndex: 10,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.textPrimary, marginBottom: 2 }}>
            {String(tooltip.item.judge ?? tooltip.item.criterion ?? tooltip.item.range ?? "")}
          </div>
          {keys.map(k => (
            <div key={k.dataKey} style={{ fontSize: 11, color: k.color }}>
              {k.label}: {Number(tooltip.item[k.dataKey])?.toFixed(2)}
            </div>
          ))}
        </div>
      )}
      {/* legend */}
      {keys.length > 1 && (
        <div className="flex gap-4 flex-wrap mt-1">
          {keys.map(k => (
            <div key={k.dataKey} className="flex items-center gap-1">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: k.color }} />
              <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{k.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SvgLineChart({ data, keys, height = 260, yMin = 0.7, yMax = 1.0 }: {
  data: Record<string, any>[];
  keys: { dataKey: string; label: string; color: string }[];
  height?: number;
  yMin?: number;
  yMax?: number;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);
  const padL = 48, padR = 16, padT = 16, padB = 36;
  const W = 500; const H = height;
  const innerW = W - padL - padR; const innerH = H - padT - padB;
  const range = yMax - yMin || 1;
  const xStep = innerW / (data.length - 1);
  const yTicks = [yMin, yMin + range * 0.25, yMin + range * 0.5, yMin + range * 0.75, yMax];

  const px = (i: number) => padL + i * xStep;
  const py = (v: number) => padT + innerH - ((v - yMin) / range) * innerH;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
        {yTicks.map((v, i) => (
          <g key={`ytick-${i}`}>
            <line x1={padL} y1={py(v)} x2={W - padR} y2={py(v)} stroke={GRID} strokeDasharray="4 4" />
            <text x={padL - 4} y={py(v) + 4} textAnchor="end" fontSize={10} fill={TICK}>{v.toFixed(2)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={`xlabel-${i}`} x={px(i)} y={H - padB + 14} textAnchor="middle" fontSize={10} fill={TICK}>{d.round}</text>
        ))}
        {keys.map(k => {
          const pts = data.map((d, i) => `${px(i)},${py(Number(d[k.dataKey]))}`).join(" ");
          return (
            <g key={`line-${k.dataKey}`}>
              <polyline points={pts} fill="none" stroke={k.color} strokeWidth={2} />
              {data.map((d, i) => (
                <circle key={`dot-${k.dataKey}-${i}`} cx={px(i)} cy={py(Number(d[k.dataKey]))} r={4}
                  fill={k.color} stroke="white" strokeWidth={1.5} />
              ))}
            </g>
          );
        })}
        {data.map((_, i) => (
          <rect key={`hover-${i}`} x={px(i) - xStep / 2} y={padT} width={xStep} height={innerH}
            fill="transparent"
            onMouseEnter={e => {
              const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx: i });
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke={GRID} />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke={GRID} />
      </svg>
      {tooltip && (
        <div style={{
          position: "absolute", left: tooltip.x + 10, top: tooltip.y - 10, pointerEvents: "none",
          background: "var(--panel-surface)", backdropFilter: "blur(20px)",
          border: "1px solid var(--glass-border-subtle)", borderRadius: 10, padding: "6px 12px",
          boxShadow: "var(--glass-shadow)", zIndex: 10,
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.textPrimary, marginBottom: 2 }}>{data[tooltip.idx].round}</div>
          {keys.map(k => (
            <div key={k.dataKey} style={{ fontSize: 11, color: k.color }}>
              {k.label}: {Number(data[tooltip.idx][k.dataKey]).toFixed(2)}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 flex-wrap mt-1">
        {keys.map(k => (
          <div key={k.dataKey} className="flex items-center gap-1">
            <div style={{ width: 16, height: 3, borderRadius: 2, background: k.color }} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{k.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SvgDonutChart({ data, size = 160 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.22;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const start = angle;
    const sweep = (d.value / total) * 2 * Math.PI;
    angle += sweep;
    return { ...d, start, sweep };
  });

  const arc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const outerPath = arc(cx, cy, r, s.start, s.start + s.sweep);
        const innerPath = arc(cx, cy, innerR, s.start + s.sweep, s.start);
        return (
          <path key={`slice-${i}`}
            d={`${outerPath} L ${cx + innerR * Math.cos(s.start + s.sweep)} ${cy + innerR * Math.sin(s.start + s.sweep)} ${innerPath} Z`}
            fill={s.color} opacity={0.9} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill={COLORS.textPrimary}>{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill={TICK}>teams</text>
    </svg>
  );
}

export function ResearchDashboard({ currentPage }: { currentPage: string }) {
  const { t } = useLanguage();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [varianceLoading, setVarianceLoading] = useState(false);

  // GET /rbl/export/csv — downloads anonymized CSV
  const handleExportCsv = () => {
    setExportLoading(true);
    setTimeout(() => {
      // Simulate blob download (in production: researchApi.exportCsv() → blob → URL.createObjectURL)
      const csvContent = "team_id,judge_id,criterion_id,score_value,round_id\nT001,J1,1,22,1\nT001,J2,1,20,1\nT002,J1,1,19,1";
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rbl_anonymized_scores.csv";
      a.click();
      URL.revokeObjectURL(url);
      setExportLoading(false);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    }, 1500);
  };

  // GET /rbl/variance-report — refresh variance data
  const handleRefreshVariance = () => {
    setVarianceLoading(true);
    setTimeout(() => setVarianceLoading(false), 1200);
  };

  const renderVariance = () => (
    <>
      <SectionHeader
        title={t("research.varianceAnalytics")}
        subtitle="GET /rbl/variance-report — Mean, StdDev, Variance per judge"
        action={
          <Button variant="outline" size="sm" icon={<Activity size={14} />} onClick={handleRefreshVariance} disabled={varianceLoading}>
            {varianceLoading ? "Refreshing..." : "Refresh Report"}
          </Button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("research.panelAvgScore")} value="79.9" icon={<TrendingUp size={20} />} color={COLORS.primary} />
        <StatCard title={t("research.avgVariance")} value="13.5" icon={<Activity size={20} />} color={COLORS.warning} />
        <StatCard title={t("research.avgStdDev")} value="3.5" icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title={t("research.flaggedJudges")} value={researchStats.flaggedJudges} icon={<AlertCircle size={20} />} color={COLORS.error} />
      </div>

      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.varianceByJudge")}</div>
        <SvgBarChart
          data={judges.map(j => ({ judge: j.shortName, variance: j.variance, stdDev: j.stdDev }))}
          keys={[
            { dataKey: "variance", label: "Variance", color: COLORS.warning },
            { dataKey: "stdDev", label: "Std Deviation", color: COLORS.primary },
          ]}
          height={260}
        />
      </Card>

      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("research.judgeStats")}</div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {[t("judgeTable.judge"), t("judgeTable.avgScore"), t("judgeTable.variance"), t("judgeTable.stdDev"), t("judgeTable.min"), t("judgeTable.max"), t("judgeTable.submissions"), t("judgeTable.status")].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {judges.map((j, i) => {
                const highVariance = j.variance > 20;
                return (
                  <tr key={j.name} style={{ borderBottom: i < judges.length - 1 ? `1px solid ${COLORS.border}` : "none", background: highVariance ? `${COLORS.warning}08` : undefined }}>
                    <td className="px-4 py-3"><div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{j.name}</div></td>
                    <td className="px-4 py-3"><span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{j.avgScore}</span></td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 13, fontWeight: 600, color: highVariance ? COLORS.error : COLORS.success }}>{j.variance}</span>
                      {highVariance && <span className="ml-1" style={{ fontSize: 10, color: COLORS.error }}>⚠ High</span>}
                    </td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{j.stdDev}</span></td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{j.minScore}</span></td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{j.maxScore}</span></td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{j.submissions}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={highVariance ? "pending" : "active"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderDistribution = () => (
    <>
      <SectionHeader title={t("research.scoreDistribution")} subtitle={t("research.scoreDistributionSubtitle")} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("research.totalScored")} value={84} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title={t("research.meanScore")} value="81.0" icon={<TrendingUp size={20} />} color={COLORS.success} />
        <StatCard title={t("research.medianScore")} value="82.5" icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title={t("research.scoreRange")} value="68–93" icon={<Activity size={20} />} color={COLORS.accent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.scoreHistogram")}</div>
          <SvgBarChart
            data={scoreDistributionData.map((d, i) => ({
              range: d.range,
              count: d.count,
              _color: i >= 4 ? COLORS.primary : i >= 2 ? COLORS.secondary : COLORS.warning,
            }))}
            keys={[{ dataKey: "count", label: "Teams", color: COLORS.primary }]}
            height={240}
          />
          <div className="flex gap-3 mt-2 flex-wrap">
            {[
              { label: "60–74", color: COLORS.warning },
              { label: "75–84", color: COLORS.secondary },
              { label: "85–100", color: COLORS.primary },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.scoreCategoryBreakdown")}</div>
          <div className="flex items-center justify-center">
            <SvgDonutChart data={pieData} size={180} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderReliability = () => (
    <>
      <SectionHeader title={t("research.interRaterReliability")} subtitle={t("research.interRaterSubtitle")} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Intraclass Correlation (ICC)" value={researchStats.icc} icon={<Activity size={20} />} color={COLORS.primary} />
        <StatCard title="Krippendorff's Alpha" value={researchStats.krippendorff} icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title="Avg Pearson r" value={researchStats.avgPearson} icon={<TrendingUp size={20} />} color={COLORS.success} />
      </div>

      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.reliabilityByBatch")}</div>
        <SvgLineChart
          data={reliabilityData}
          keys={[
            { dataKey: "icc", label: "ICC", color: COLORS.primary },
            { dataKey: "kripp", label: "Krippendorff's α", color: COLORS.secondary },
            { dataKey: "pearson", label: "Pearson r", color: COLORS.success },
          ]}
          height={260}
          yMin={0.7}
          yMax={1.0}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { metric: "ICC = 0.84", label: "Good Reliability", desc: "ICC > 0.75 indicates good inter-rater reliability. The panel shows consistent evaluation with acceptable agreement.", color: COLORS.success },
          { metric: "α = 0.81", label: "Substantial Agreement", desc: "Krippendorff's alpha > 0.80 indicates substantial agreement. Data is suitable for research publication.", color: COLORS.primary },
          { metric: "1 flagged judge", label: "High Variance Detected", desc: "Assoc. Prof. Tran shows variance (σ²=27.0) exceeding the acceptable threshold. Recommend calibration session.", color: COLORS.warning },
        ].map(item => (
          <Card key={item.metric} className="p-4" style={{ borderLeft: `3px solid ${item.color}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: item.color }}>{item.metric}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, marginTop: 2 }}>{item.label}</div>
            <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>{item.desc}</p>
          </Card>
        ))}
      </div>
    </>
  );

  const renderExport = () => (
    <>
      <SectionHeader title={t("research.dataExport")} subtitle="GET /rbl/export/csv — Anonymized research dataset" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 }}>{t("research.exportConfig")}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
            Endpoint: <code style={{ fontFamily: "monospace", color: COLORS.primary }}>GET /rbl/export/csv</code> — requires Bearer token (RESEARCH role)
          </div>
          <div className="space-y-4">
            <div className="p-3 rounded-xl" style={{ background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}20` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{t("research.anonymization")}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                All judge and team identifiers are anonymized (J1, J2... / T001, T002...). Only scores and metadata are exported for RBL research.
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>CSV SCHEMA</div>
              <code style={{ fontSize: 11, color: COLORS.textSecondary, display: "block", lineHeight: 1.6 }}>
                team_id, judge_id, criterion_id, score_value, round_id,<br/>
                submission_id, event_id, scored_at
              </code>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" icon={<Download size={14} />} onClick={handleExportCsv} disabled={exportLoading}>
                {exportLoading ? t("common.preparing") : "Download CSV"}
              </Button>
              {exportDone && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ {t("common.exportReady")}</span>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("research.exportContents")}</div>
          <div className="space-y-3">
            {[
              { label: "Raw score matrix (teams × judges)", included: true },
              { label: "Criterion-level breakdowns", included: true },
              { label: "Round-by-round progression", included: true },
              { label: "Statistical summaries (mean, std, ICC)", included: true },
              { label: "Outlier flags and calibration notes", included: true },
              { label: "Judge identities (anonymized as J1, J2...)", included: true },
              { label: "Team identities (anonymized as T001, T002...)", included: true },
              { label: "Individual judge comments", included: false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                {item.included
                  ? <CheckCircle size={14} style={{ color: COLORS.success, flexShrink: 0 }} />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: COLORS.border }} />
                }
                <span style={{ fontSize: 13, color: item.included ? COLORS.textPrimary : COLORS.textSecondary }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderComparison = () => (
    <>
      <SectionHeader title={t("research.judgeComparison")} subtitle={t("research.judgeComparisonSubtitle")} />
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.criterionComparison")}</div>
        <SvgBarChart
          data={comparisonData}
          keys={judges.map((j, i) => ({ dataKey: j.shortName, label: j.shortName, color: chartColors[i % chartColors.length] }))}
          height={280}
          yMin={65}
          yMax={90}
        />
      </Card>

      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("research.scoreRangeOverview")}</div>
        <div className="space-y-4">
          {judges.map((j, i) => (
            <div key={j.name}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{j.name}</span>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Range: {j.minScore}–{j.maxScore}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: j.variance > 20 ? COLORS.error : COLORS.success }}>σ²={j.variance}</span>
                </div>
              </div>
              <div className="relative h-3 rounded-full" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div className="absolute h-full rounded-full" style={{ left: `${((j.minScore - 60) / 40) * 100}%`, width: `${((j.maxScore - j.minScore) / 40) * 100}%`, background: chartColors[i % chartColors.length], opacity: 0.8 }} />
                <div className="absolute w-2 h-full rounded-full" style={{ left: `${((j.avgScore - 60) / 40) * 100}%`, background: chartColors[i % chartColors.length], transform: "translateX(-50%)" }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between mt-1">
            {[60, 70, 80, 90, 100].map(v => (
              <span key={v} style={{ fontSize: 11, color: COLORS.textSecondary }}>{v}</span>
            ))}
          </div>
        </div>
      </Card>
    </>
  );

  const renderStats = () => (
    <>
      <SectionHeader title={t("research.researchStats")} subtitle={t("research.researchStatsSubtitle")} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t("research.totalJudges")} value={5} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title={t("research.meanPanelScore")} value="79.9" icon={<TrendingUp size={20} />} color={COLORS.success} />
        <StatCard title={t("research.panelVariance")} value={researchStats.panelVariance} icon={<Activity size={20} />} color={COLORS.warning} />
        <StatCard title={t("research.iccScore")} value={researchStats.icc} icon={<BarChart2 size={20} />} color={COLORS.secondary} />
        <StatCard title={t("research.krippendorffAlpha")} value={researchStats.krippendorff} icon={<CheckCircle size={20} />} color={COLORS.accent} />
        <StatCard title={t("research.outlierTeams")} value={researchStats.outlierTeams} icon={<AlertCircle size={20} />} color={COLORS.error} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("research.researchFindings")}</div>
          <div className="space-y-3">
            {[
              { finding: "High inter-rater reliability", detail: "ICC = 0.84, suitable for research publication (threshold > 0.75)", type: "positive" },
              { finding: "One high-variance judge identified", detail: "Assoc. Prof. Tran (σ²=27.0) shows inconsistent scoring patterns across criteria", type: "warning" },
              { finding: "Scoring bias detected in Round 1", detail: "AI Agents track scores were 3.2 points higher than Web3 track (p<0.05)", type: "warning" },
              { finding: "Calibration effective in Round 2", detail: "Variance decreased from avg 16.1 in R1 to 11.4 in R2 after calibration session", type: "positive" },
              { finding: "Substantial agreement on top-ranked teams", detail: "Top 5 teams agreed upon by all judges (Kendall's W = 0.79)", type: "positive" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: item.type === "positive" ? `${COLORS.success}08` : `${COLORS.warning}08`, border: `1px solid ${item.type === "positive" ? COLORS.success : COLORS.warning}20` }}>
                {item.type === "positive"
                  ? <CheckCircle size={16} style={{ color: COLORS.success, flexShrink: 0, marginTop: 1 }} />
                  : <AlertCircle size={16} style={{ color: COLORS.warning, flexShrink: 0, marginTop: 1 }} />
                }
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{item.finding}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("research.publicationReadiness")}</div>
          <div className="space-y-3 mb-6">
            {[
              { label: "ICC threshold met (≥0.75)", met: true },
              { label: "Krippendorff's α threshold met (≥0.80)", met: true },
              { label: "Sample size sufficient (n≥80)", met: true },
              { label: "Calibration session documented", met: true },
              { label: "No systematic judge bias", met: false },
              { label: "All rounds complete", met: false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                {item.met
                  ? <CheckCircle size={16} style={{ color: COLORS.success }} />
                  : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: COLORS.border }} />
                }
                <span style={{ fontSize: 13, color: item.met ? COLORS.textPrimary : COLORS.textSecondary }}>{item.label}</span>
              </div>
            ))}
          </div>
          <ProgressBar value={4} max={6} color={COLORS.primary} label="4 of 6 criteria met" />
          <Button variant="outline" size="sm" icon={<Download size={13} />} className="mt-4">{t("common.downloadResearchReport")}</Button>
        </Card>
      </div>
    </>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "variance": return renderVariance();
      case "distribution": return renderDistribution();
      case "reliability": return renderReliability();
      case "export": return renderExport();
      case "comparison": return renderComparison();
      case "stats": return renderStats();
      default: return renderVariance();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
