import { useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle,
  Loader,
  Play,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/apiClient";
import { teamService } from "@/features/teams/api/teamService";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";

type ApiStatus = "idle" | "loading" | "success" | "error";

interface EndpointCardProps {
  title: string;
  method: string;
  path: string;
  icon: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onRun: () => void;
  children?: ReactNode;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl outline-none"
        style={{
          fontSize: 14,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.textPrimary,
        }}
      />
    </label>
  );
}

function EndpointCard({ title, method, path, icon, disabled, loading, onRun, children }: EndpointCardProps) {
  const methodColor = method === "GET" ? COLORS.secondary : method === "DELETE" ? COLORS.error : COLORS.primary;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center justify-center rounded-lg"
              style={{ width: 30, height: 30, background: `${methodColor}12`, color: methodColor }}
            >
              {icon}
            </span>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{title}</div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="px-2 py-1 rounded-lg"
              style={{ fontSize: 11, fontWeight: 800, background: `${methodColor}12`, color: methodColor }}
            >
              {method}
            </span>
            <code
              className="truncate"
              style={{ fontSize: 12, color: COLORS.textSecondary, background: "transparent" }}
              title={path}
            >
              {path}
            </code>
          </div>
        </div>
        <Button
          variant={method === "DELETE" ? "danger" : "primary"}
          size="sm"
          icon={loading ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
          onClick={onRun}
          disabled={disabled || loading}
        >
          Run
        </Button>
      </div>
      {children && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>}
    </Card>
  );
}

export function Team() {
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("Test Team FE");
  const [userId, setUserId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [responseNote, setResponseNote] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("Test disqualification reason");
  const [eligibilityNote, setEligibilityNote] = useState("");
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [activeAction, setActiveAction] = useState("");
  const [result, setResult] = useState<unknown>({
    message: "Login first, then open /team and run a team API.",
    apiBaseUrl: API_BASE_URL,
  });

  const run = async (action: string, request: () => Promise<unknown>) => {
    setActiveAction(action);
    setStatus("loading");
    try {
      const data = await request();
      setResult(data ?? { ok: true });
      setStatus("success");
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "Request failed",
      });
      setStatus("error");
    } finally {
      setActiveAction("");
    }
  };

  const prettyResult = typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title="Team"
        subtitle={`Backend target: ${API_BASE_URL}`}
        action={<StatusBadge status={status === "success" ? "approved" : status === "error" ? "rejected" : "active"} />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-4">
          <EndpointCard
            title="Create team"
            method="POST"
            path="/api/v1/teams"
            icon={<Users size={15} />}
            loading={activeAction === "create"}
            disabled={!eventId || !categoryId || !teamName}
            onRun={() => run("create", () => teamService.create({ eventId, categoryId, teamName }))}
          >
            <Field label="EVENT ID" value={eventId} onChange={setEventId} />
            <Field label="CATEGORY ID" value={categoryId} onChange={setCategoryId} />
            <Field label="TEAM NAME" value={teamName} onChange={setTeamName} />
          </EndpointCard>

          <EndpointCard
            title="Get teams by event"
            method="GET"
            path="/api/v1/events/{eventId}/teams"
            icon={<Search size={15} />}
            loading={activeAction === "getByEvent"}
            disabled={!eventId}
            onRun={() => run("getByEvent", () => teamService.getByEvent(eventId))}
          >
            <Field label="EVENT ID" value={eventId} onChange={setEventId} />
          </EndpointCard>

          <EndpointCard
            title="Get team by ID"
            method="GET"
            path="/api/v1/teams/{teamId}"
            icon={<Search size={15} />}
            loading={activeAction === "getById"}
            disabled={!teamId}
            onRun={() => run("getById", () => teamService.getById(teamId))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
          </EndpointCard>

          <EndpointCard
            title="Request to join team"
            method="POST"
            path="/api/v1/teams/{teamId}/join"
            icon={<UserCheck size={15} />}
            loading={activeAction === "join"}
            disabled={!teamId}
            onRun={() => run("join", () => teamService.requestJoin(teamId))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
          </EndpointCard>

          <EndpointCard
            title="Get pending join requests"
            method="GET"
            path="/api/v1/teams/{teamId}/requests"
            icon={<Search size={15} />}
            loading={activeAction === "pending"}
            disabled={!teamId}
            onRun={() => run("pending", () => teamService.getPendingRequests(teamId))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
          </EndpointCard>

          <EndpointCard
            title="Approve join request"
            method="PUT"
            path="/api/v1/teams/requests/{requestId}"
            icon={<CheckCircle size={15} />}
            loading={activeAction === "approve"}
            disabled={!requestId}
            onRun={() => run("approve", () => teamService.handleJoinRequest(requestId, "APPROVED", responseNote))}
          >
            <Field label="REQUEST ID" value={requestId} onChange={setRequestId} />
            <Field label="RESPONSE NOTE" value={responseNote} onChange={setResponseNote} />
          </EndpointCard>

          <EndpointCard
            title="Reject join request"
            method="PUT"
            path="/api/v1/teams/requests/{requestId}"
            icon={<Trash2 size={15} />}
            loading={activeAction === "reject"}
            disabled={!requestId}
            onRun={() => run("reject", () => teamService.handleJoinRequest(requestId, "REJECTED", responseNote))}
          >
            <Field label="REQUEST ID" value={requestId} onChange={setRequestId} />
            <Field label="RESPONSE NOTE" value={responseNote} onChange={setResponseNote} />
          </EndpointCard>

          <EndpointCard
            title="Get member detail"
            method="GET"
            path="/api/v1/teams/{teamId}/members/{userId}"
            icon={<Search size={15} />}
            loading={activeAction === "member"}
            disabled={!teamId || !userId}
            onRun={() => run("member", () => teamService.getMemberDetail(teamId, userId))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
            <Field label="USER ID" value={userId} onChange={setUserId} />
          </EndpointCard>

          <EndpointCard
            title="Remove member"
            method="DELETE"
            path="/api/v1/teams/{teamId}/members/{userId}"
            icon={<Trash2 size={15} />}
            loading={activeAction === "remove"}
            disabled={!teamId || !userId}
            onRun={() => run("remove", () => teamService.removeMember(teamId, userId))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
            <Field label="USER ID" value={userId} onChange={setUserId} />
          </EndpointCard>

          <EndpointCard
            title="Review team eligibility"
            method="GET"
            path="/api/v1/admin/events/{eventId}/teams/eligibility-review"
            icon={<ShieldCheck size={15} />}
            loading={activeAction === "review"}
            disabled={!eventId}
            onRun={() => run("review", () => teamService.reviewEligibility(eventId))}
          >
            <Field label="EVENT ID" value={eventId} onChange={setEventId} />
          </EndpointCard>

          <EndpointCard
            title="Approve eligibility"
            method="POST"
            path="/api/v1/admin/teams/{teamId}/eligibility-decision"
            icon={<ShieldCheck size={15} />}
            loading={activeAction === "eligibilityApprove"}
            disabled={!teamId}
            onRun={() => run("eligibilityApprove", () => teamService.decideEligibility(teamId, true, eligibilityNote))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
            <Field label="NOTE" value={eligibilityNote} onChange={setEligibilityNote} />
          </EndpointCard>

          <EndpointCard
            title="Reject eligibility"
            method="POST"
            path="/api/v1/admin/teams/{teamId}/eligibility-decision"
            icon={<ShieldCheck size={15} />}
            loading={activeAction === "eligibilityReject"}
            disabled={!teamId}
            onRun={() => run("eligibilityReject", () => teamService.decideEligibility(teamId, false, eligibilityNote))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
            <Field label="NOTE" value={eligibilityNote} onChange={setEligibilityNote} />
          </EndpointCard>

          <EndpointCard
            title="Disqualify team"
            method="POST"
            path="/api/v1/admin/teams/{teamId}/disqualify"
            icon={<Trash2 size={15} />}
            loading={activeAction === "disqualify"}
            disabled={!teamId || !disqualifyReason}
            onRun={() => run("disqualify", () => teamService.disqualify(teamId, disqualifyReason))}
          >
            <Field label="TEAM ID" value={teamId} onChange={setTeamId} />
            <Field label="REASON" value={disqualifyReason} onChange={setDisqualifyReason} />
          </EndpointCard>
        </div>

        <div className="xl:sticky xl:top-6 h-fit">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>Response</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  {status === "loading" ? "Calling backend..." : "Latest API result"}
                </div>
              </div>
              {status === "loading" && <Loader size={18} className="animate-spin" style={{ color: COLORS.primary }} />}
            </div>
            <pre
              className="rounded-xl p-4 overflow-auto"
              style={{
                minHeight: 420,
                maxHeight: 720,
                fontSize: 12,
                lineHeight: 1.55,
                background: "rgba(20, 24, 28, 0.92)",
                color: status === "error" ? "#fecaca" : "#d1fae5",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {prettyResult}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
