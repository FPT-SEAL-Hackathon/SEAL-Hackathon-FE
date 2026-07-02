import { api } from "@/lib/api/apiClient";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface EventStatusResponse {
  eventStatusId: string;
  eventStatusName: string;
}

export type UserParticipationStatus =
  | "NOT_REGISTERED"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED";

export interface EventResponse {
  eventId: string;
  eventName: string;
  description: string;
  location: string;
  bannerImageUrl: string;
  eventStatus: EventStatus | EventStatusResponse;
  eventStatusId: string;
  eventStatusName: EventStatus | string;
  registrationStart: string;
  registrationEnd: string;
  eventStartDate: string;
  eventEndDate: string;
  maxTeamSize: number;
  minTeamSize: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participantStatus?: UserParticipationStatus | string | null;
}

export interface CreateEventRequest {
  eventName: string;
  description?: string;
  location: string;
  bannerImageUrl?: string;
  eventStatusId: string;
  registrationStart: string;
  registrationEnd: string;
  eventStartDate: string;
  eventEndDate: string;
  maxTeamSize: number;
  minTeamSize: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  eventName: string;
  eventStatusId: string;
}

export interface UpdateEventStatusRequest {
  eventStatusId: string;
}

interface BackendEnvelope<T> {
  data?: T;
  statusCode?: number;
  message?: string;
}

interface PageEnvelope<T> {
  content?: T[];
}

type RawEventRecord = Record<string, unknown>;

const PARTICIPANT_STATUSES = new Set([
  "NOT_REGISTERED",
  "PENDING",
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
]);

function isRecord(value: unknown): value is RawEventRecord {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function participantStatusValue(value: unknown): UserParticipationStatus | string | null | undefined {
  const status = stringValue(value)?.toUpperCase();
  if (!status || !PARTICIPANT_STATUSES.has(status)) return undefined;
  if (status === "PENDING_APPROVAL") return "PENDING";
  return status;
}

function lifecycleStatusFrom(raw: RawEventRecord): string {
  const eventStatus = raw.eventStatus;
  if (isRecord(eventStatus)) {
    return stringValue(eventStatus.eventStatusName)
      ?? stringValue(eventStatus.name)
      ?? stringValue(eventStatus.statusName)
      ?? stringValue(eventStatus.code)
      ?? "UNKNOWN";
  }
  const directStatus = stringValue(raw.status);
  return stringValue(eventStatus)
    ?? stringValue(raw.eventStatusName)
    ?? stringValue(raw.eventLifecycleStatus)
    ?? stringValue(raw.lifecycleStatus)
    ?? (directStatus && !PARTICIPANT_STATUSES.has(directStatus.toUpperCase()) ? directStatus : undefined)
    ?? "UNKNOWN";
}

export function normalizeEventResponse(raw: EventResponse | RawEventRecord): EventResponse {
  const record = raw as RawEventRecord;
  const rawEventStatus = isRecord(record.eventStatus) ? record.eventStatus : {};
  const eventStatusName = lifecycleStatusFrom(record);
  const eventStatusId = stringValue(rawEventStatus.eventStatusId)
    ?? stringValue(record.eventStatusId)
    ?? "";
  const eventName = stringValue(record.eventName)
    ?? stringValue(record.name)
    ?? stringValue(record.title)
    ?? "Untitled Event";
  const userParticipationStatus = participantStatusValue(record.userParticipationStatus)
    ?? participantStatusValue(record.participantStatus)
    ?? participantStatusValue(record.myRegistrationStatus)
    ?? participantStatusValue(record.registrationStatus)
    ?? "NOT_REGISTERED";

  return {
    eventId: stringValue(record.eventId) ?? stringValue(record.id) ?? "",
    eventName,
    description: stringValue(record.description) ?? "",
    location: stringValue(record.location) ?? "",
    bannerImageUrl: stringValue(record.bannerImageUrl) ?? "",
    eventStatus: {
      ...(rawEventStatus as unknown as EventStatusResponse),
      eventStatusId,
      eventStatusName,
    },
    eventStatusId,
    eventStatusName,
    registrationStart: stringValue(record.registrationStart) ?? "",
    registrationEnd: stringValue(record.registrationEnd) ?? stringValue(record.registrationDeadline) ?? "",
    eventStartDate: stringValue(record.eventStartDate) ?? stringValue(record.startDate) ?? "",
    eventEndDate: stringValue(record.eventEndDate) ?? stringValue(record.endDate) ?? "",
    maxTeamSize: numberValue(record.maxTeamSize) ?? 0,
    minTeamSize: numberValue(record.minTeamSize) ?? 0,
    createdById: stringValue(record.createdById) ?? "",
    createdAt: stringValue(record.createdAt) ?? "",
    updatedAt: stringValue(record.updatedAt) ?? "",
    participantStatus: userParticipationStatus,
  };
}

function normalizeEvents(events: EventResponse[]) {
  return events.map(normalizeEventResponse);
}

function unwrapList<T>(response: T[] | BackendEnvelope<T[] | PageEnvelope<T>> | PageEnvelope<T>): T[] {
  if (Array.isArray(response)) return response;
  if ("content" in response && Array.isArray(response.content)) return response.content;
  if ("data" in response && Array.isArray(response.data)) return response.data;
  if ("data" in response && response.data && !Array.isArray(response.data) && Array.isArray(response.data.content)) {
    return response.data.content;
  }
  throw new Error(("message" in response && response.message) || "Unexpected events response from server.");
}

export const eventService = {
  getAll: async (auth = false) => normalizeEvents(unwrapList(await api.get<EventResponse[] | BackendEnvelope<EventResponse[]>>("/api/v1/events", auth))),
  getPublic: async () => normalizeEvents(unwrapList(await api.get<EventResponse[] | BackendEnvelope<EventResponse[] | PageEnvelope<EventResponse>> | PageEnvelope<EventResponse>>("/api/v1/public/events", false))),
  getById: async (id: string, auth = false) => normalizeEventResponse(await api.get<EventResponse>(`/api/v1/events/${id}`, auth)),
  create: (data: CreateEventRequest) => api.post<EventResponse>("/api/v1/events", data),
  update: (id: string, data: UpdateEventRequest) => api.put<EventResponse>(`/api/v1/events/${id}`, data),
  updateStatus: (id: string, data: UpdateEventStatusRequest) => api.patch<EventResponse>(`/api/v1/events/${id}/status`, data),
  delete: (id: string) => api.delete(`/api/v1/events/${id}`),
};
