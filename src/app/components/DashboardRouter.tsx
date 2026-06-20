import { MemberDashboard } from "./member/MemberDashboard";
import { LeaderDashboard } from "./leader/LeaderDashboard";
import { JudgeDashboard } from "./judge/JudgeDashboard";
import { MentorDashboard } from "./mentor/MentorDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ResearchDashboard } from "./research/ResearchDashboard";

export function DashboardRouter({ role, currentPage, onNavigate }: { role: string; currentPage: string; onNavigate: (p: string) => void }) {
  switch (role) {
    case "member":
      return <MemberDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    case "leader":
      return <LeaderDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    case "judge":
      return <JudgeDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    case "mentor":
      return <MentorDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    case "admin":
      return <AdminDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    case "research":
      return <ResearchDashboard currentPage={currentPage} />;
    default:
      return <MemberDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
}
