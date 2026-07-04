import { ROUND_STATUSES } from "../constants/roundStatus";

export const getRoundStatus = (id: string) =>
  ROUND_STATUSES.find(s => s.statusId === id);