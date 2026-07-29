import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react";
import { researchService, ConsensusMatrixResponse } from "@/features/research/api/researchService";
import { useAuth } from "@/features/auth/store/authStore";
import { Card } from "@/components/shared/UIComponents";

export function JudgeConsensusMatrix({ roundId }: { roundId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ConsensusMatrixResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roundId) return;
    
    setLoading(true);
    researchService.getConsensusMatrix(roundId)
      .then(res => {
        setData(res);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load consensus matrix", err);
        setError("Could not load the consensus matrix.");
      })
      .finally(() => setLoading(false));
  }, [roundId]);

  const handleExportCsv = () => {
    if (!roundId) return;
    const url = researchService.exportCalibrationCsvUrl(roundId);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl">
        {error}
      </Card>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Consensus Matrix</h3>
          <p className="text-sm text-gray-500">Score dispersion across judges</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={16} />
          Export Pivot CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Criterion</th>
              <th className="px-6 py-4">Median</th>
              <th className="px-6 py-4 font-bold text-gray-800">Score range (min–max)</th>
              <th className="px-6 py-4 font-bold text-gray-800">Deviation (SD)</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => {
              const isDanger = row.status === "DANGER";
              const isWarning = row.status === "WARNING";
              const isGood = row.status === "GOOD";

              // Personal context
              const myScore = user?.userId ? row.judgeScores[user.userId] : undefined;
              let deviationText = null;
              let isHighDeviation = false;

              if (myScore !== undefined && myScore !== null) {
                const diff = myScore - row.median;
                const sign = diff > 0 ? "+" : "";
                isHighDeviation = Math.abs(diff) >= 2; // threshold for personal warning
                
                deviationText = (
                  <div className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-md inline-block ${isHighDeviation ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    Your score: {myScore} | Δ {sign}{diff.toFixed(1)}
                  </div>
                );
              }

              // Row styling
              let rowClass = "bg-white hover:bg-gray-50 transition-colors";
              let statusContent = null;

              if (isDanger) {
                rowClass = "bg-red-50/50 hover:bg-red-50 transition-colors";
                statusContent = (
                  <span className="flex items-center gap-1.5 text-red-700 font-semibold bg-red-100 px-2.5 py-1 rounded-md w-max">
                    <AlertTriangle size={16} /> DANGER
                  </span>
                );
              } else if (isWarning) {
                statusContent = (
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md w-max border border-amber-100">
                    <AlertCircle size={16} /> WARNING
                  </span>
                );
              } else if (isGood) {
                rowClass = "bg-white hover:bg-gray-50 transition-colors text-gray-400";
                statusContent = (
                  <span className="flex items-center gap-1.5 text-emerald-600/70 font-medium">
                    <CheckCircle size={16} /> GOOD
                  </span>
                );
              }

              return (
                <tr key={idx} className={rowClass}>
                  <td className={`px-6 py-4 font-medium ${isDanger ? 'text-red-900' : isGood ? 'text-gray-500' : 'text-gray-900'}`}>
                    {row.criteriaName}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-base font-semibold ${isDanger ? 'text-red-800' : 'text-gray-700'}`}>
                      {row.median.toFixed(1)}
                    </div>
                    {deviationText}
                  </td>
                  <td className={`px-6 py-4 font-bold ${isDanger ? 'text-red-800' : isGood ? 'text-gray-400' : 'text-gray-800'}`}>
                    {row.minScore.toFixed(1)} - {row.maxScore.toFixed(1)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${isDanger ? 'text-red-800' : isGood ? 'text-gray-400' : 'text-gray-800'}`}>
                    {row.standardDeviation.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {statusContent}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
