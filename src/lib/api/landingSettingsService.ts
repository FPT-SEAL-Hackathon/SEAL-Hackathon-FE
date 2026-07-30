import { api } from "@/lib/api/apiClient";
import { type LandingPageSettingsData, DEFAULT_LANDING_SETTINGS } from "@/pages/admin/components/AdminLandingSettingsView";

export const landingSettingsService = {
  async getLandingSettings(): Promise<LandingPageSettingsData> {
    try {
      const data = await api.get<LandingPageSettingsData>("/api/v1/settings/landing", false);
      if (!data) return DEFAULT_LANDING_SETTINGS;
      return {
        gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : DEFAULT_LANDING_SETTINGS.gallery,
        footer: { ...DEFAULT_LANDING_SETTINGS.footer, ...(data.footer || {}) },
      };
    } catch (err) {
      console.warn("Failed to fetch landing settings from API, falling back to defaults", err);
      return DEFAULT_LANDING_SETTINGS;
    }
  },

  async updateLandingSettings(data: LandingPageSettingsData): Promise<LandingPageSettingsData> {
    const res = await api.put<LandingPageSettingsData>("/api/v1/settings/landing", data, true);
    return {
      gallery: Array.isArray(res.gallery) && res.gallery.length > 0 ? res.gallery : DEFAULT_LANDING_SETTINGS.gallery,
      footer: { ...DEFAULT_LANDING_SETTINGS.footer, ...(res.footer || {}) },
    };
  },
};
