import { useState, useEffect } from "react";
import {
  Image as ImageIcon, Save, Plus, Trash2, CheckCircle, RefreshCw,
  Sparkles, MapPin, Mail, Phone, Globe, Info, Camera, Upload
} from "lucide-react";
import { Card, SectionHeader, Button } from "@/components/shared/UIComponents";

export interface LandingGallerySettingItem {
  id: string;
  title: string;
  category: string;
  url: string;
  spanClass: string;
  description: string;
  isFeatured?: boolean;
}

export interface LandingFooterSettings {
  tagline: string;
  address: string;
  email: string;
  phone: string;
  copyright: string;
}

export interface LandingPageSettingsData {
  gallery: LandingGallerySettingItem[];
  footer: LandingFooterSettings;
}

export const DEFAULT_LANDING_SETTINGS: LandingPageSettingsData = {
  gallery: [
    {
      id: "gal-1",
      title: "Grand Finals Main Stage",
      category: "Opening & Expo",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
      spanClass: "md:col-span-2 md:row-span-2 min-h-[288px] md:min-h-[396px]",
      description: "The grand opening ceremony & live team presentations at SEAL Hackathon Arena.",
      isFeatured: true,
    },
    {
      id: "gal-2",
      title: "24h Intensive Hackathon",
      category: "Team Coding Lab",
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-2 md:row-span-1 min-h-[190px]",
      description: "Developers collaborating non-stop to solve real-world tech challenges.",
    },
    {
      id: "gal-3",
      title: "Expert Mentorship",
      category: "1-on-1 Guidance",
      url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
      spanClass: "md:col-span-1 md:row-span-1 min-h-[190px]",
      description: "Industry leaders advising teams on system architecture and UX.",
    },
    {
      id: "gal-4",
      title: "Judge Pitch Defense",
      category: "Evaluation",
      url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
      spanClass: "md:col-span-1 md:row-span-1 min-h-[190px]",
      description: "Teams presenting prototype solutions to expert judges.",
    },
    {
      id: "gal-5",
      title: "Champion Award Ceremony",
      category: "Victory & Prizes",
      url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-2 md:row-span-1 min-h-[190px]",
      description: "Honoring winning teams and presenting grand prize trophies.",
    },
    {
      id: "gal-6",
      title: "Developer Community Expo",
      category: "Networking",
      url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-2 md:row-span-1 min-h-[190px]",
      description: "Connecting student innovators with recruiters and tech sponsors.",
    },
  ],
  footer: {
    tagline: "FPT University's official hackathon & tech innovation platform. Connecting student talent, industry experts, and future leaders.",
    address: "FPT University Campus, Hoa Lac Hi-Tech Park, Hanoi, Vietnam",
    email: "contact@sealhackathon.edu.vn",
    phone: "+84 (024) 7300 5588",
    copyright: "© 2026 SEAL Hackathon Platform — FPT University. All rights reserved.",
  },
};

const STORAGE_KEY = "seal_landing_settings";

export function loadLandingSettings(): LandingPageSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LANDING_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      gallery: Array.isArray(parsed.gallery) && parsed.gallery.length > 0 ? parsed.gallery : DEFAULT_LANDING_SETTINGS.gallery,
      footer: { ...DEFAULT_LANDING_SETTINGS.footer, ...(parsed.footer || {}) },
    };
  } catch {
    return DEFAULT_LANDING_SETTINGS;
  }
}

export function AdminLandingSettingsView({ context }: { context?: any }) {
  const [settings, setSettings] = useState<LandingPageSettingsData>(loadLandingSettings);
  const [activeTab, setActiveTab] = useState<"gallery" | "footer">("gallery");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("seal_landing_settings_updated"));
      setSaveSuccess(true);
      setSaveMessage("Landing Page settings saved successfully!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save settings: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleReset = () => {
    if (confirm("Reset Landing Page gallery and footer settings to defaults?")) {
      setSettings(DEFAULT_LANDING_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("seal_landing_settings_updated"));
      setSaveSuccess(true);
      setSaveMessage("Reset to default settings.");
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Gallery handlers
  const updateGalleryItem = (id: string, field: keyof LandingGallerySettingItem, value: any) => {
    setSettings(prev => ({
      ...prev,
      gallery: prev.gallery.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateGalleryItem(id, "url", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const setFeaturedItem = (id: string) => {
    setSettings(prev => ({
      ...prev,
      gallery: prev.gallery.map((item, idx) => ({
        ...item,
        isFeatured: item.id === id,
        spanClass: item.id === id 
          ? "md:col-span-2 md:row-span-2 min-h-[288px] md:min-h-[396px]" 
          : (idx % 3 === 0 ? "md:col-span-2 md:row-span-1 min-h-[190px]" : "md:col-span-1 md:row-span-1 min-h-[190px]"),
      })),
    }));
  };

  const addGalleryItem = () => {
    const newId = `gal-${Date.now()}`;
    const newItem: LandingGallerySettingItem = {
      id: newId,
      title: "New Competition Moment",
      category: "Hackathon Highlight",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
      spanClass: "md:col-span-1 md:row-span-1 min-h-[190px]",
      description: "Description of the event photo.",
    };
    setSettings(prev => ({
      ...prev,
      gallery: [...prev.gallery, newItem],
    }));
  };

  const removeGalleryItem = (id: string) => {
    if (settings.gallery.length <= 1) {
      alert("At least 1 gallery photo is required.");
      return;
    }
    setSettings(prev => ({
      ...prev,
      gallery: prev.gallery.filter(item => item.id !== id),
    }));
  };

  // Footer handlers
  const updateFooter = (field: keyof LandingFooterSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      footer: { ...prev.footer, [field]: value },
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Landing Page Settings"
        subtitle="Customize public gallery photos, Cloudinary image URLs, and footer contact details"
      />

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-2xl border border-white/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "gallery" ? "bg-orange-500 text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera size={16} className="inline mr-2" />
            Gallery Photos ({settings.gallery.length})
          </button>
          <button
            onClick={() => setActiveTab("footer")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "footer" ? "bg-orange-500 text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info size={16} className="inline mr-2" />
            Footer & Contact Info
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-all"
          >
            <RefreshCw size={14} />
            Reset Defaults
          </button>
          <Button onClick={handleSave} className="bg-orange-500 text-white hover:bg-orange-600">
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Tab 1: Gallery Settings */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Camera size={20} className="text-orange-500" />
              Manage Competition Gallery
            </h3>
            <button
              onClick={addGalleryItem}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-bold transition-all"
            >
              <Plus size={16} />
              Add New Photo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.gallery.map((item, index) => (
              <Card key={item.id} className="relative overflow-hidden p-6 space-y-5 border border-white/25 rounded-3xl shadow-lg hover:border-orange-500/30 transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-sm">
                      {item.isFeatured ? "★ Featured Hero Image (Large)" : `Photo #${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.isFeatured && (
                      <button
                        onClick={() => setFeaturedItem(item.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
                      >
                        Set Featured
                      </button>
                    )}
                    <button
                      onClick={() => removeGalleryItem(item.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Preview Image */}
                <div className="h-44 rounded-2xl overflow-hidden bg-black/40 relative border border-white/20 shadow-md my-3">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute(
                        "src",
                        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                      );
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-white font-medium shadow-sm">
                    {item.category || "Category"}
                  </div>
                </div>

                {/* Image Upload & Input Fields */}
                <div className="space-y-4 text-sm pt-1">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-semibold text-muted-foreground">Image Source / Link</label>
                      <label
                        htmlFor={`file-upload-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-md text-xs font-semibold cursor-pointer transition-all active:scale-95"
                      >
                        <Upload size={14} />
                        Upload from Computer
                      </label>
                      <input
                        id={`file-upload-${item.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, item.id)}
                      />
                    </div>
                    <input
                      type="text"
                      value={item.url.startsWith("data:") ? "[Upload from computer]" : item.url}
                      onChange={(e) => updateGalleryItem(item.id, "url", e.target.value)}
                      placeholder="Paste Cloudinary link or click the button to upload from computer..."
                      className="w-full px-3.5 py-2.5 rounded-xl glass border border-white/20 text-xs font-mono text-muted-foreground focus:text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGalleryItem(item.id, "title", e.target.value)}
                        placeholder="e.g. Grand Finals Stage"
                        className="w-full px-3 py-2 rounded-xl glass border border-white/20 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-medium">Category / Tag</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateGalleryItem(item.id, "category", e.target.value)}
                        placeholder="e.g. Opening & Expo"
                        className="w-full px-3 py-2 rounded-xl glass border border-white/20 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1 font-medium">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateGalleryItem(item.id, "description", e.target.value)}
                      placeholder="Brief caption for the photo..."
                      className="w-full px-3 py-2 rounded-xl glass border border-white/20 text-xs"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Footer & Contact Settings */}
      {activeTab === "footer" && (
        <Card className="space-y-6 border border-white/20 p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-white/10 pb-4">
            <Info size={20} className="text-orange-500" />
            Footer & Contact Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                Platform Tagline / Description
              </label>
              <textarea
                rows={3}
                value={settings.footer.tagline}
                onChange={(e) => updateFooter("tagline", e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/20 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                  Campus Address
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input
                    type="text"
                    value={settings.footer.address}
                    onChange={(e) => updateFooter("address", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/20 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input
                    type="text"
                    value={settings.footer.email}
                    onChange={(e) => updateFooter("email", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/20 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                  <input
                    type="text"
                    value={settings.footer.phone}
                    onChange={(e) => updateFooter("phone", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/20 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={settings.footer.copyright}
                  onChange={(e) => updateFooter("copyright", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass border border-white/20 text-sm"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
