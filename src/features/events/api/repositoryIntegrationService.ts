import { api, type ParsedApiError } from "@/lib/api/apiClient";

export interface ConnectIntegrationRequest {
  repositoryUrl: string;
  token: string;
}

export interface RepositoryResponse {
  integrationId: string;
  repositoryId: string;
  connectionStatus: string;
  syncStatus: string;
  externalId: string;
  repositoryName: string;
  repositoryFullName: string;
  repositoryUrl: string;
  description: string;
  connectedAt: string;
  lastSyncAt: string | null;
}

export interface RepositoryIssue {
  issueId: string;
  externalId: string;
  number: number;
  title: string;
  state: string;
  url: string;
  authorUsername?: string;
  assigneeUsername?: string;
  labels?: string;
  milestone?: string;
  commentCount: number;
  externalCreatedAt: string;
  externalUpdatedAt: string;
  externalClosedAt?: string;
  lastSynchronizedAt: string;
}

export interface RepositorySyncResponse {
  repositoryId: string;
  status: string;
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  hasMore: boolean;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

class RepositoryIntegrationService {
  private readonly baseUrl = "/api/v1/events";

  async testConnection(eventId: string, request: ConnectIntegrationRequest): Promise<void> {
    await api.post(`${this.baseUrl}/${eventId}/integrations/repository/test`, request);
  }

  async connectIntegration(eventId: string, request: ConnectIntegrationRequest): Promise<RepositorySyncResponse> {
    return api.post<RepositorySyncResponse>(`${this.baseUrl}/${eventId}/integrations/repository/connect`, request);
  }

  async getRepositories(eventId: string): Promise<RepositoryResponse[]> {
    return api.get<RepositoryResponse[]>(`${this.baseUrl}/${eventId}/integrations/repository`);
  }

  async syncRepository(eventId: string, repositoryId: string): Promise<RepositorySyncResponse> {
    return api.post<RepositorySyncResponse>(`${this.baseUrl}/${eventId}/integrations/repository/${repositoryId}/sync`, {});
  }

  async disconnectIntegration(eventId: string, integrationId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${eventId}/integrations/repository/${integrationId}`);
  }

  async getRepositoryIssues(eventId: string, repositoryId: string, page = 0, size = 20): Promise<PageResponse<RepositoryIssue>> {
    return api.get<PageResponse<RepositoryIssue>>(
      `${this.baseUrl}/${eventId}/integrations/repository/${repositoryId}/issues?page=${page}&size=${size}`
    );
  }
}

export const repositoryIntegrationService = new RepositoryIntegrationService();
