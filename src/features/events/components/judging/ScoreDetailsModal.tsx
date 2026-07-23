import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import { judgingService, JudgingDTO } from "@/features/judging/api/judgingService";
import { COLORS } from "@/components/shared/UIComponents";
import { motion, AnimatePresence } from "framer-motion";
import { roundService } from "@/features/judging/api/roundService";

interface Props {
  submissionId: string;
  roundId: string;
  studentMode?: boolean;
  onClose: () => void;
}

export function ScoreDetailsModal({ submissionId, roundId, studentMode, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [judgings, setJudgings] = useState<JudgingDTO[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [judgingsData, roundData] = await Promise.all([
          studentMode ? judgingService.getPublishedBySubmission(submissionId) : judgingService.getBySubmission(submissionId),
          roundService.getCriteria(roundId)
        ]);
        setJudgings(judgingsData.filter((j: JudgingDTO) => !j.isCalibration));
        setCriteria(roundData);
      } catch (e: any) {
        console.error("Failed to fetch score details", e);
        if (studentMode && e?.status === 403) {
          setErrorMsg("Results are not published yet, or you don't have permission to view them.");
        } else {
          setErrorMsg("Failed to load judging results.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [submissionId, roundId, studentMode]);

  // Group by judge
  const judges = Array.from(new Set(judgings.map(j => j.judgeName)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: COLORS.border }}>
            <h3 className="font-bold text-lg text-gray-800">Score Breakdown</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-10"><Loader className="animate-spin text-primary" /></div>
            ) : errorMsg ? (
              <div className="text-center p-10 text-red-500 font-medium">{errorMsg}</div>
            ) : judgings.length === 0 ? (
              <div className="text-center p-10 text-gray-500">No scores recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      <th className="p-3 text-left border font-semibold">Judge / Criterion</th>
                      {criteria.sort((a,b) => a.sortOrder - b.sortOrder).map(c => (
                        <th key={c.roundCriterionId} className="p-3 text-center border font-semibold">
                          {c.criterionName} ({c.weight * 100}%)
                        </th>
                      ))}
                      <th className="p-3 text-center border font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judges.map(judge => {
                      const judgeScores = judgings.filter(j => j.judgeName === judge);
                      let total = 0;
                      return (
                        <tr key={judge} className="hover:bg-gray-50">
                          <td className="p-3 border font-medium text-gray-700">{judge}</td>
                          {criteria.map(c => {
                            const score = judgeScores.find(j => j.roundCriterionId === c.roundCriterionId);
                            if (score) total += score.scoreValue * c.weight;
                            return (
                              <td key={c.roundCriterionId} className="p-3 text-center border">
                                {score ? score.scoreValue : "-"}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center border font-bold text-primary">{total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
