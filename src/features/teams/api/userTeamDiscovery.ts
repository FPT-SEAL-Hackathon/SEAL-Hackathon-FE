import { getTeamStatusInfoForTeam, isTeamRejected, teamService, type TeamResponse } from "@/features/teams/api/teamService";

export const USER_TEAMS_STORAGE_KEY = "seal_user_teams";

type EventLike = {
  eventId?: string;
};

type DiscoverUserTeamsOptions = {
  activeOnly?: boolean;
};

export function userBelongsToTeam(team: TeamResponse, userId?: string) {
  if (!userId) return false;
  return team.leaderUserId === userId
    || team.members.some(member => member.userId === userId && member.active !== false);
}

export function isCurrentUserTeam(team: TeamResponse, userId?: string) {
  return userBelongsToTeam(team, userId) && !isTeamRejected(team);
}

async function verifyCurrentMembership(team: TeamResponse, userId: string, options: DiscoverUserTeamsOptions = {}) {
  if (!isCurrentUserTeam(team, userId)) return false;
  if (options.activeOnly && getTeamStatusInfoForTeam(team).badge !== "active") return false;

  try {
    const detail = await teamService.getMemberDetail(team.teamId, userId);
    return detail.userId === userId && detail.active !== false;
  } catch {
    return false;
  }
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

export function mergeTeams(...teamLists: TeamResponse[][]) {
  const teamsById = new Map<string, TeamResponse>();
  teamLists.flat().forEach(team => {
    if (team.teamId) teamsById.set(team.teamId, team);
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
  const cachedTeams = getStoredUserTeams(userId);

  const eventIds = Array.from(new Set(
    events
      .map(event => event.eventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  ));
  if (eventIds.length === 0) return cachedTeams;

  const results = await Promise.all(
    eventIds.map(eventId => teamService.getByEvent(eventId).catch(() => [] as TeamResponse[])),
  );

  const candidatesById = new Map<string, TeamResponse>();
  results
    .flat()
    .filter(team => isCurrentUserTeam(team, userId))
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
