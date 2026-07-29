import { displayTeamName, getTeamStatusInfoForTeam, isTeamRejected, teamService, type TeamResponse } from "@/features/teams/api/teamService";
import { eventParticipantService } from "@/features/eventParticipants/api/eventParticipantService";

export const USER_TEAMS_STORAGE_KEY = "seal_user_teams";

type EventLike = {
  eventId?: string;
};

type DiscoverUserTeamsOptions = {
  activeOnly?: boolean;
};

export function userBelongsToTeam(team: TeamResponse, userId?: string) {
  if (!userId) return false;
  const memberRecord = team.members.find(member => member.userId === userId);
  if (memberRecord) return memberRecord.active !== false;
  return team.leaderUserId === userId && team.members.length === 0;
}

export function isCurrentUserTeam(team: TeamResponse, userId?: string) {
  return userBelongsToTeam(team, userId) && !isTeamRejected(team);
}

function isRejectedParticipantStatus(value?: string | null) {
  return value?.trim().replace(/[-\s]+/g, "_").toUpperCase() === "REJECTED";
}

function memberHasRejectedParticipantStatus(team: TeamResponse, userId: string) {
  const member = team.members.find(item => item.userId === userId);
  return isRejectedParticipantStatus(member?.participantStatus)
    || isRejectedParticipantStatus(member?.participantStatusName);
}

async function verifyCurrentMembership(team: TeamResponse, userId: string, options: DiscoverUserTeamsOptions = {}) {
  if (!isCurrentUserTeam(team, userId)) return false;
  if (memberHasRejectedParticipantStatus(team, userId)) return false;
  const teamStatus = getTeamStatusInfoForTeam(team).badge;
  if (options.activeOnly && teamStatus !== "active") return false;

  try {
    const detail = await teamService.getMemberDetail(team.teamId, userId);
    if (detail && detail.userId === userId && detail.active === false) return false;
    if (isRejectedParticipantStatus(detail?.participantStatus) || isRejectedParticipantStatus(detail?.participantStatusName)) {
      return false;
    }
  } catch {
    // If detail API fails, rely on isCurrentUserTeam check which already verified active membership from team.members
  }

  const participation = await eventParticipantService.getMyParticipation(team.eventId).catch(() => null);
  if (participation?.participantStatus === "REJECTED" && teamStatus !== "forming") return false;

  return true;
}

export function sortTeamsByNewest(teams: TeamResponse[]) {
  return [...teams].sort((a, b) => {
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function isTeamResponse(value: unknown): value is TeamResponse {
  const team = value as Partial<TeamResponse>;
  return typeof team?.teamId === "string"
    && typeof team?.eventId === "string"
    && typeof team?.teamName === "string"
    && Array.isArray(team?.members);
}

function normalizeStoredTeam(team: TeamResponse): TeamResponse {
  return {
    ...team,
    rawTeamName: team.rawTeamName ?? team.teamName,
    teamName: displayTeamName(team.teamName),
  };
}

export function mergeTeams(...teamLists: TeamResponse[][]) {
  const teamsById = new Map<string, TeamResponse>();
  teamLists.flat().forEach(team => {
    if (team.teamId) teamsById.set(team.teamId, normalizeStoredTeam(team));
  });
  return sortTeamsByNewest(Array.from(teamsById.values()));
}

export function getStoredUserTeams(userId?: string) {
  if (!userId) return [] as TeamResponse[];
  try {
    const raw = localStorage.getItem(USER_TEAMS_STORAGE_KEY);
    const teams = raw ? JSON.parse(raw) as unknown[] : [];
    return teams
      .filter(isTeamResponse)
      .map(normalizeStoredTeam)
      .filter(team => isCurrentUserTeam(team, userId));
  } catch {
    return [];
  }
}

export function saveStoredUserTeams(teams: TeamResponse[], userId?: string) {
  if (!userId) return;
  try {
    const visibleTeams = mergeTeams(teams).filter(team => isCurrentUserTeam(team, userId));
    localStorage.setItem(USER_TEAMS_STORAGE_KEY, JSON.stringify(visibleTeams));
  } catch {
    // Ignore storage failures; API discovery still works.
  }
}

export function rememberUserTeam(team: TeamResponse, userId?: string) {
  if (!isCurrentUserTeam(team, userId)) return;
  saveStoredUserTeams(mergeTeams(getStoredUserTeams(userId), [team]), userId);
}

export async function discoverUserTeamsForEvents(events: EventLike[], userId?: string, options: DiscoverUserTeamsOptions = {}) {
  if (!userId) return [] as TeamResponse[];

  const myTeams = await teamService.getMyTeams().catch(() => [] as TeamResponse[]);
  if (myTeams.length === 0 && events.length === 0) {
    return getStoredUserTeams(userId);
  }

  const candidatesById = new Map<string, TeamResponse>();

  myTeams
    .filter(team => !options.activeOnly || getTeamStatusInfoForTeam(team).badge === "active")
    .forEach(team => {
      if (team.teamId) candidatesById.set(team.teamId, team);
    });

  const verifiedTeams = await Promise.all(
    Array.from(candidatesById.values()).map(async team => (
      await verifyCurrentMembership(team, userId, options) ? team : null
    )),
  );
  const discoveredTeams = verifiedTeams.filter((team): team is TeamResponse => Boolean(team));
  saveStoredUserTeams(discoveredTeams, userId);
  return discoveredTeams;
}
