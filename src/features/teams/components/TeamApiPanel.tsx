import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle,
  Eye,
  Loader,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button, Card, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import {
  teamService,
  type DisqualificationResponse,
  type EligibilityDecisionResponse,
  type JoinTeamRequestResponse,
  type TeamEligibilityReviewResponse,
  type TeamMemberDetailResponse,
  type TeamResponse,
} from "@/features/teams/api/teamService";

type TeamApiKey =
  | "create"
  | "getById"
  | "getByEvent"
  | "requestJoin"
  | "pendingRequests"
  | "handleJoinRequest"
  | "memberDetail"
  | "removeMember"
  | "eligibilityReview"
  | "eligibilityDecision"
  | "disqualify";

type ApiResult =
  | TeamResponse
  | TeamResponse[]
  | JoinTeamRequestResponse
  | JoinTeamRequestResponse[]
  | TeamMemberDetailResponse
  | TeamEligibilityReviewResponse[]
  | EligibilityDecisionResponse
  | DisqualificationResponse
  | { success: true; message: string };

const emptyResults: Partial<Record<TeamApiKey, ApiResult>> = {};
const emptyErrors: Partial<Record<TeamApiKey, string>> = {};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2.5 rounded-xl outline-none"
        style={{
          fontSize: 13,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.textPrimary,
        }}
      />
    </label>
  );
}

function ResultBox({ result, error }: { result?: ApiResult; error?: string }) {
  if (!result && !error) return null;

  return (
    <div
      className="mt-4 rounded-xl p-3 overflow-auto"
      style={{
        maxHeight: 220,
        background: error ? `${COLORS.error}10` : COLORS.bg,
        border: `1px solid ${error ? `${COLORS.error}30` : COLORS.border}`,
      }}
    >
      {error ? (
        <div style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{error}</div>
      ) : (
        <pre style={{ fontSize: 11, color: COLORS.textSecondary, whiteSpace: "pre-wrap", margin: 0 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

function EndpointCard({
  title,
  method,
  path,
  icon,
  children,
  actionLabel,
  loading,
  disabled,
  onRun,
  result,
  error,
}: {
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  icon: ReactNode;
  children: ReactNode;
  actionLabel: string;
  loading: boolean;
  disabled?: boolean;
  onRun: () => void;
  result?: ApiResult;
  error?: string;
}) {
  const methodColor = method === "GET" ? COLORS.primary : method === "POST" ? COLORS.success : method === "PUT" ? COLORS.warning : COLORS.error;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <span
          className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 38, height: 38, background: `${methodColor}12`, color: methodColor }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{title}</span>
            <span
              className="px-2 py-0.5 rounded-lg"
              style={{ fontSize: 10, fontWeight: 800, color: methodColor, background: `${methodColor}12` }}
            >
              {method}
            </span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 3, wordBreak: "break-all" }}>{path}</div>
        </div>
      </div>

      <div className="space-y-3">{children}</div>

      <Button
        variant={method === "DELETE" ? "danger" : "primary"}
        size="sm"
        className="mt-4"
        icon={loading ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
        disabled={loading || disabled}
        onClick={onRun}
      >
        {loading ? "Calling..." : actionLabel}
      </Button>

      <ResultBox result={result} error={error} />
    </Card>
  );
}

export function TeamApiPanel({ initialEventId = "", initialTeamId = "" }: { initialEventId?: string; initialTeamId?: string }) {
  const [form, setForm] = useState({
    eventId: initialEventId,
    categoryId: "",
    teamName: "",
    teamId: initialTeamId,
    userId: "",
    requestId: "",
    requestAction: "APPROVED" as "APPROVED" | "REJECTED",
    responseNote: "",
    approved: "true",
    eligibilityNote: "",
    disqualifyReason: "",
  });
  const [loading, setLoading] = useState<Partial<Record<TeamApiKey, boolean>>>({});
  const [results, setResults] = useState<Partial<Record<TeamApiKey, ApiResult>>>(emptyResults);
  const [errors, setErrors] = useState<Partial<Record<TeamApiKey, string>>>(emptyErrors);

  const setField = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const canUseTeamId = form.teamId.trim().length > 0;
  const canUseEventId = form.eventId.trim().length > 0;
  const canCreate = canUseEventId && form.categoryId.trim().length > 0 && form.teamName.trim().length > 0;

  const createdTeam = useMemo(() => {
    const result = results.create;
    return result && !Array.isArray(result) && "teamId" in result ? result.teamId : "";
  }, [results.create]);

  async function run<T extends ApiResult>(key: TeamApiKey, caller: () => Promise<T>) {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: "" }));
    try {
      const data = await caller();
      setResults(prev => ({ ...prev, [key]: data }));

      if (!form.teamId && data && !Array.isArray(data) && "teamId" in data) {
        setField("teamId", data.teamId);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: getErrorMessage(error) }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>Team API Calls</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
              Test each Team Management endpoint without changing the existing page flow.
            </div>
          </div>
          <StatusBadge status={createdTeam ? "active" : "pending"} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <Field label="EVENT ID" value={form.eventId} onChange={value => setField("eventId", value)} placeholder="UUID from event" />
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
          <Field label="CATEGORY ID" value={form.categoryId} onChange={value => setField("categoryId", value)} placeholder="UUID from category" />
          <Field label="USER ID" value={form.userId} onChange={value => setField("userId", value)} placeholder="UUID from user/member" />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <EndpointCard
          title="Create team"
          method="POST"
          path="/api/v1/teams"
          icon={<PlusCircle size={18} />}
          actionLabel="Create Team"
          loading={!!loading.create}
          disabled={!canCreate}
          onRun={() => run("create", () => teamService.create({
            eventId: form.eventId.trim(),
            categoryId: form.categoryId.trim(),
            teamName: form.teamName.trim(),
          }))}
          result={results.create}
          error={errors.create}
        >
          <Field label="TEAM NAME" value={form.teamName} onChange={value => setField("teamName", value)} placeholder="Your team name" />
        </EndpointCard>

        <EndpointCard
          title="Get team details"
          method="GET"
          path="/api/v1/teams/{teamId}"
          icon={<Eye size={18} />}
          actionLabel="Get Team"
          loading={!!loading.getById}
          disabled={!canUseTeamId}
          onRun={() => run("getById", () => teamService.getById(form.teamId.trim()))}
          result={results.getById}
          error={errors.getById}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
        </EndpointCard>

        <EndpointCard
          title="Get teams by event"
          method="GET"
          path="/api/v1/events/{eventId}/teams"
          icon={<Users size={18} />}
          actionLabel="Get Teams"
          loading={!!loading.getByEvent}
          disabled={!canUseEventId}
          onRun={() => run("getByEvent", () => teamService.getByEvent(form.eventId.trim()))}
          result={results.getByEvent}
          error={errors.getByEvent}
        >
          <Field label="EVENT ID" value={form.eventId} onChange={value => setField("eventId", value)} placeholder="UUID from event" />
        </EndpointCard>

        <EndpointCard
          title="Request to join team"
          method="POST"
          path="/api/v1/teams/{teamId}/join"
          icon={<UserPlus size={18} />}
          actionLabel="Request Join"
          loading={!!loading.requestJoin}
          disabled={!canUseTeamId}
          onRun={() => run("requestJoin", () => teamService.requestJoin(form.teamId.trim()))}
          result={results.requestJoin}
          error={errors.requestJoin}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
        </EndpointCard>

        <EndpointCard
          title="Get pending join requests"
          method="GET"
          path="/api/v1/teams/{teamId}/requests"
          icon={<Search size={18} />}
          actionLabel="Get Requests"
          loading={!!loading.pendingRequests}
          disabled={!canUseTeamId}
          onRun={() => run("pendingRequests", () => teamService.getPendingRequests(form.teamId.trim()))}
          result={results.pendingRequests}
          error={errors.pendingRequests}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
        </EndpointCard>

        <EndpointCard
          title="Approve or reject join request"
          method="PUT"
          path="/api/v1/teams/requests/{requestId}"
          icon={<UserCheck size={18} />}
          actionLabel="Submit Decision"
          loading={!!loading.handleJoinRequest}
          disabled={!form.requestId.trim()}
          onRun={() => run("handleJoinRequest", () => teamService.handleJoinRequest(
            form.requestId.trim(),
            form.requestAction,
            form.responseNote.trim() || undefined,
          ))}
          result={results.handleJoinRequest}
          error={errors.handleJoinRequest}
        >
          <Field label="REQUEST ID" value={form.requestId} onChange={value => setField("requestId", value)} placeholder="UUID from join request" />
          <label className="block">
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ACTION</span>
            <select
              value={form.requestAction}
              onChange={event => setField("requestAction", event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>
          <Field label="RESPONSE NOTE" value={form.responseNote} onChange={value => setField("responseNote", value)} placeholder="Optional" />
        </EndpointCard>

        <EndpointCard
          title="Get member detail"
          method="GET"
          path="/api/v1/teams/{teamId}/members/{userId}"
          icon={<Users size={18} />}
          actionLabel="Get Member"
          loading={!!loading.memberDetail}
          disabled={!canUseTeamId || !form.userId.trim()}
          onRun={() => run("memberDetail", () => teamService.getMemberDetail(form.teamId.trim(), form.userId.trim()))}
          result={results.memberDetail}
          error={errors.memberDetail}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
          <Field label="USER ID" value={form.userId} onChange={value => setField("userId", value)} placeholder="UUID from user/member" />
        </EndpointCard>

        <EndpointCard
          title="Remove member or leave team"
          method="DELETE"
          path="/api/v1/teams/{teamId}/members/{userId}"
          icon={<Trash2 size={18} />}
          actionLabel="Remove Member"
          loading={!!loading.removeMember}
          disabled={!canUseTeamId || !form.userId.trim()}
          onRun={() => run("removeMember", async () => {
            await teamService.removeMember(form.teamId.trim(), form.userId.trim());
            return { success: true, message: "Member removed or current user left the team." };
          })}
          result={results.removeMember}
          error={errors.removeMember}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
          <Field label="USER ID" value={form.userId} onChange={value => setField("userId", value)} placeholder="UUID from user/member" />
        </EndpointCard>

        <EndpointCard
          title="Review eligibility by event"
          method="GET"
          path="/api/v1/admin/events/{eventId}/teams/eligibility-review"
          icon={<ShieldCheck size={18} />}
          actionLabel="Review Eligibility"
          loading={!!loading.eligibilityReview}
          disabled={!canUseEventId}
          onRun={() => run("eligibilityReview", () => teamService.reviewEligibility(form.eventId.trim()))}
          result={results.eligibilityReview}
          error={errors.eligibilityReview}
        >
          <Field label="EVENT ID" value={form.eventId} onChange={value => setField("eventId", value)} placeholder="UUID from event" />
        </EndpointCard>

        <EndpointCard
          title="Decide team eligibility"
          method="POST"
          path="/api/v1/admin/teams/{teamId}/eligibility-decision"
          icon={<ShieldCheck size={18} />}
          actionLabel="Save Decision"
          loading={!!loading.eligibilityDecision}
          disabled={!canUseTeamId}
          onRun={() => run("eligibilityDecision", () => teamService.decideEligibility(
            form.teamId.trim(),
            form.approved === "true",
            form.eligibilityNote.trim() || undefined,
          ))}
          result={results.eligibilityDecision}
          error={errors.eligibilityDecision}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
          <label className="block">
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>APPROVED</span>
            <select
              value={form.approved}
              onChange={event => setField("approved", event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <Field label="NOTE" value={form.eligibilityNote} onChange={value => setField("eligibilityNote", value)} placeholder="Optional" />
        </EndpointCard>

        <EndpointCard
          title="Disqualify team"
          method="POST"
          path="/api/v1/admin/teams/{teamId}/disqualify"
          icon={<Trash2 size={18} />}
          actionLabel="Disqualify"
          loading={!!loading.disqualify}
          disabled={!canUseTeamId || !form.disqualifyReason.trim()}
          onRun={() => run("disqualify", () => teamService.disqualify(form.teamId.trim(), form.disqualifyReason.trim()))}
          result={results.disqualify}
          error={errors.disqualify}
        >
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="UUID from team" />
          <Field label="REASON" value={form.disqualifyReason} onChange={value => setField("disqualifyReason", value)} placeholder="Required" />
        </EndpointCard>
      </div>
    </div>
  );
}
