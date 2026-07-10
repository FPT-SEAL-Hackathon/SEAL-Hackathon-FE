import { api } from "@/lib/api/apiClient";

export interface SystemSettings {
  platformName: string;
  maxTeamSize: number;
  minTeamSize: number;
  submissionGracePeriod: number;
  contactEmail: string;
  allowLateSubmissions: boolean;
  enablePublicLeaderboard: boolean;
  requireEmailVerification: boolean;
}

export interface UpdateSystemSettingsRequest {
  platformName?: string;
  maxTeamSize?: number;
  minTeamSize?: number;
  submissionGracePeriod?: number;
  contactEmail?: string;
  allowLateSubmissions?: boolean;
  enablePublicLeaderboard?: boolean;
  requireEmailVerification?: boolean;
}

export const settingsService = {
  /** Lấy settings hiện tại từ server (chỉ ORGANIZER). */
  getSettings: () => api.get<SystemSettings>("/api/v1/settings"),

  /** Cập nhật settings — gửi toàn bộ object settings hiện tại. */
  updateSettings: (data: UpdateSystemSettingsRequest) =>
    api.put<SystemSettings>("/api/v1/settings", data),
};
