import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { LeaderDashboard } from "@/pages/leader/LeaderDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { MentorDashboard } from "@/pages/mentor/MentorDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";

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
    default:
      return <MemberDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
}
