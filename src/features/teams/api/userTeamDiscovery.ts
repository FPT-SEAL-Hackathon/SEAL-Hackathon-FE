import { TEAM_STATUS_IDS, teamService, type TeamResponse } from "@/features/teams/api/teamService";

export const USER_TEAMS_STORAGE_KEY = "seal_user_teams";

type EventLike = {
  eventId?: string;
};

export function userBelongsToTeam(team: TeamResponse, userId?: string) {
  if (!userId) return false;
  return team.leaderUserId === userId
    || team.members.some(member => member.userId === userId);
}

export function isCurrentUserTeam(team: TeamResponse, userId?: string) {
  if (!userBelongsToTeam(team, userId)) return false;
  const statusId = team.teamStatusId?.toLowerCase();
  return statusId === TEAM_STATUS_IDS.FORMING
    || statusId === TEAM_STATUS_IDS.ACTIVE;
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

export async function discoverUserTeamsForEvents(events: EventLike[], userId?: string) {
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

  const teamsById = new Map<string, TeamResponse>();
  results
    .flat()
    .filter(team => isCurrentUserTeam(team, userId))
    .forEach(team => {
      if (team.teamId) teamsById.set(team.teamId, team);
    });

  const discoveredTeams = Array.from(teamsById.values());
  const mergedTeams = mergeTeams(cachedTeams, discoveredTeams);
  saveStoredUserTeams(mergedTeams, userId);
  return mergedTeams;
}
