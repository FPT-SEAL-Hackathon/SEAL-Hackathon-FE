import { useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  Loader,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/store/authStore";
import { Button, Card, COLORS, DataTable, StatusBadge } from "@/components/shared/UIComponents";
import {
  teamService,
  type JoinTeamRequestResponse,
  type TeamMemberResponse,
  type TeamResponse,
} from "@/features/teams/api/teamService";

type ActionKey =
  | "create"
  | "getById"
  | "getByEvent"
  | "join"
  | "requests"
  | "approve"
  | "reject"
  | "memberDetail"
  | "remove";

type RoleMode = "auto" | "member" | "leader";

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
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
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

function InlineMessage({ message, tone }: { message: string; tone: "success" | "error" | "info" }) {
  const color = tone === "success" ? COLORS.success : tone === "error" ? COLORS.error : COLORS.textSecondary;
  return (
    <div className="px-3 py-2 rounded-xl" style={{ background: `${color}10`, color, fontSize: 13, border: `1px solid ${color}25` }}>
      {message}
    </div>
  );
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function memberRows(members: TeamMemberResponse[]) {
  return members.map(member => ({
    teamMemberId: member.teamMemberId,
    userId: member.userId,
    active: member.active ? "Active" : "Inactive",
    joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-",
  }));
}

export function TeamApiPanel({
  initialEventId = "",
  initialTeamId = "",
  mode = "auto",
}: {
  initialEventId?: string;
  initialTeamId?: string;
  mode?: RoleMode;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    eventId: initialEventId,
    categoryId: "",
    teamId: initialTeamId,
    teamName: "",
    requestId: "",
    responseNote: "",
    memberUserId: user?.id ?? "",
  });
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [requests, setRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [loading, setLoading] = useState<Partial<Record<ActionKey, boolean>>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [memberDetail, setMemberDetail] = useState<unknown>(null);

  const setField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isLeader = useMemo(() => {
    if (mode === "leader") return true;
    if (mode === "member") return false;
    return !!selectedTeam && !!user?.id && selectedTeam.leaderUserId === user.id;
  }, [mode, selectedTeam, user?.id]);

  const canUseTeam = form.teamId.trim().length > 0;
  const canUseEvent = form.eventId.trim().length > 0;
  const canCreate = canUseEvent && form.categoryId.trim().length > 0 && form.teamName.trim().length > 0;

  async function run<T>(key: ActionKey, caller: () => Promise<T>, onSuccess?: (data: T) => void, successText = "Done.") {
    setLoading(prev => ({ ...prev, [key]: true }));
    setMessage(null);
    try {
      const data = await caller();
      onSuccess?.(data);
      setMessage({ tone: "success", text: successText });
    } catch (error) {
      setMessage({ tone: "error", text: formatError(error) });
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const loadTeam = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    run(
      "getById",
      () => teamService.getById(teamId),
      team => {
        setSelectedTeam(team);
        setField("teamId", team.teamId);
        setField("eventId", team.eventId);
        setField("categoryId", team.categoryId);
      },
      "Team loaded.",
    );
  };

  const loadTeamsByEvent = () => {
    run(
      "getByEvent",
      () => teamService.getByEvent(form.eventId.trim()),
      data => {
        setTeams(data);
        if (data[0] && !selectedTeam) {
          setSelectedTeam(data[0]);
          setField("teamId", data[0].teamId);
          setField("categoryId", data[0].categoryId);
        }
      },
      "Teams loaded.",
    );
  };

  const loadRequests = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    run("requests", () => teamService.getPendingRequests(teamId), setRequests, "Join requests loaded.");
  };

  const createTeam = () => {
    run(
      "create",
      () => teamService.create({
        eventId: form.eventId.trim(),
        categoryId: form.categoryId.trim(),
        teamName: form.teamName.trim(),
      }),
      team => {
        setSelectedTeam(team);
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setField("teamId", team.teamId);
      },
      "Team created.",
    );
  };

  const requestJoin = () => {
    run("join", () => teamService.requestJoin(form.teamId.trim()), undefined, "Join request sent.");
  };

  const decideRequest = (requestId: string, action: "APPROVED" | "REJECTED") => {
    run(
      action === "APPROVED" ? "approve" : "reject",
      () => teamService.handleJoinRequest(requestId, action, form.responseNote.trim() || undefined),
      updated => setRequests(prev => prev.filter(request => request.requestId !== updated.requestId)),
      action === "APPROVED" ? "Request approved." : "Request rejected.",
    );
  };

  const removeMember = (userId = form.memberUserId.trim()) => {
    if (!form.teamId.trim() || !userId) return;
    run(
      "remove",
      async () => {
        await teamService.removeMember(form.teamId.trim(), userId);
        return true;
      },
      () => {
        setSelectedTeam(prev => prev ? { ...prev, members: prev.members.filter(member => member.userId !== userId) } : prev);
      },
      isLeader ? "Member removed." : "You left the team.",
    );
  };

  const getMemberDetail = () => {
    run(
      "memberDetail",
      () => teamService.getMemberDetail(form.teamId.trim(), form.memberUserId.trim()),
      setMemberDetail,
      "Member detail loaded.",
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: COLORS.primary }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>
                {isLeader ? "Team Management" : "My Team"}
              </div>
              <StatusBadge status={isLeader ? "active" : "pending"} />
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 5 }}>
              {selectedTeam ? `${selectedTeam.teamName} - ${selectedTeam.members.length} member(s)` : "Load an event or team to begin."}
            </div>
          </div>
          {message && <InlineMessage tone={message.tone} message={message.text} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
          <Field label="EVENT ID" value={form.eventId} onChange={value => setField("eventId", value)} placeholder="Event UUID" />
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="Team UUID" />
          <Field label="CATEGORY ID" value={form.categoryId} onChange={value => setField("categoryId", value)} placeholder="Category UUID" />
          <Field label="MEMBER USER ID" value={form.memberUserId} onChange={value => setField("memberUserId", value)} placeholder="User UUID" />
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <Button
            variant="outline"
            size="sm"
            icon={loading.getByEvent ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            disabled={!canUseEvent || loading.getByEvent}
            onClick={loadTeamsByEvent}
          >
            Load Event Teams
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={loading.getById ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
            disabled={!canUseTeam || loading.getById}
            onClick={() => loadTeam()}
          >
            Load Team
          </Button>
          {!isLeader && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={loading.join ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                disabled={!canUseTeam || loading.join}
                onClick={requestJoin}
              >
                Request Join
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={!canUseTeam || !form.memberUserId.trim() || loading.remove}
                onClick={() => removeMember()}
              >
                Leave Team
              </Button>
            </>
          )}
        </div>
      </Card>

      {isLeader && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 14 }}>
            Leader Actions
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px] gap-4">
            <Field label="TEAM NAME" value={form.teamName} onChange={value => setField("teamName", value)} placeholder="Team name" />
            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={loading.create ? <Loader size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                disabled={!canCreate || loading.create}
                onClick={createTeam}
              >
                Create Team
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="outline"
              size="sm"
              icon={loading.requests ? <Loader size={14} className="animate-spin" /> : <UserCheck size={14} />}
              disabled={!canUseTeam || loading.requests}
              onClick={() => loadRequests()}
            >
              Load Join Requests
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              disabled={!canUseTeam || !form.memberUserId.trim() || loading.remove}
              onClick={() => removeMember()}
            >
              Remove Member
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={loading.memberDetail ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
              disabled={!canUseTeam || !form.memberUserId.trim() || loading.memberDetail}
              onClick={getMemberDetail}
            >
              Member Detail
            </Button>
          </div>

          <div className="mt-4">
            <Field label="RESPONSE NOTE" value={form.responseNote} onChange={value => setField("responseNote", value)} placeholder="Optional note for join request" />
          </div>
        </Card>
      )}

      {teams.length > 0 && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Teams In Event</div>
          <DataTable
            columns={[
              { key: "teamName", label: "Team" },
              { key: "teamId", label: "Team ID" },
              { key: "memberCount", label: "Members" },
              {
                key: "action",
                label: "Action",
                render: (_value, row) => (
                  <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={() => loadTeam(row.teamId)}>
                    Open
                  </Button>
                ),
              },
            ]}
            data={teams.map(team => ({
              teamName: team.teamName,
              teamId: team.teamId,
              memberCount: team.members.length,
              action: team.teamId,
            }))}
          />
        </Card>
      )}

      {selectedTeam && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{selectedTeam.teamName}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                Leader: {selectedTeam.leaderUserId}
              </div>
            </div>
            <StatusBadge status={isLeader ? "active" : "pending"} />
          </div>
          <DataTable
            columns={[
              { key: "userId", label: "User ID" },
              { key: "active", label: "Status" },
              { key: "joinedAt", label: "Joined" },
              {
                key: "action",
                label: "Action",
                render: (_value, row) => isLeader ? (
                  <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => removeMember(row.userId)}>
                    Remove
                  </Button>
                ) : null,
              },
            ]}
            data={memberRows(selectedTeam.members)}
          />
        </Card>
      )}

      {isLeader && requests.length > 0 && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Join Requests</div>
          <div className="space-y-3">
            {requests.map(request => (
              <div
                key={request.requestId}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl"
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>User: {request.userId}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                    {request.requestStatus} - {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={loading.approve ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    disabled={loading.approve || loading.reject}
                    onClick={() => decideRequest(request.requestId, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={loading.reject ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    disabled={loading.approve || loading.reject}
                    onClick={() => decideRequest(request.requestId, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {memberDetail ? (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Member Detail</div>
          <pre style={{ fontSize: 12, color: COLORS.textSecondary, whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify(memberDetail, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
