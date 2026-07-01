import { motion, AnimatePresence } from "motion/react";
import { Settings } from "lucide-react";

interface AppSettings {
  dateFormat: string;
  itemsPerPage: string;
  emailNotif: boolean;
  inAppNotif: boolean;
  deadlineReminder: boolean;
  showProfilePublic: boolean;
  showTeamInfo: boolean;
  compactMode: boolean;
  soundEnabled: boolean;
}

interface AppSettingsModalProps {
  appSettingsOpen: boolean;
  setAppSettingsOpen: (open: boolean) => void;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isDark: boolean;
  onToggleDark: () => void;
  accentColor: string;
}

function SettingsToggle({ label, desc, value, accent, onChange }: { label: string; desc: string; value: boolean; accent: string; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        className="flex-shrink-0 rounded-full transition-colors"
        animate={{ background: value ? accent : "rgba(180,150,120,0.25)" }}
        style={{ width: 40, height: 22, position: "relative", cursor: "pointer" }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute rounded-full bg-white"
          style={{ width: 18, height: 18, top: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
        />
      </motion.button>
    </div>
  );
}

export function AppSettingsModal({
  appSettingsOpen,
  setAppSettingsOpen,
  appSettings,
  setAppSettings,
  isDark,
  onToggleDark,
  accentColor,
}: AppSettingsModalProps) {
  return (
    <AnimatePresence>
      {appSettingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAppSettingsOpen(false)}
            className="fixed inset-0"
            style={{ background: "rgba(30,15,5,0.25)", backdropFilter: "blur(4px)", zIndex: 60 }}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full flex flex-col overflow-hidden"
            style={{
              width: 380,
              zIndex: 61,
              background: "var(--panel-surface)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              borderLeft: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "-24px 0 80px rgba(180,100,20,0.14)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 flex-shrink-0" style={{ height: 64, borderBottom: "1px solid var(--glass-border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: "linear-gradient(135deg, #F47920, #FF9040)", boxShadow: "0 4px 12px rgba(244,121,32,0.35)" }}>
                  <Settings size={16} color="white" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>App Settings</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setAppSettingsOpen(false)}
                className="flex items-center justify-center rounded-xl w-8 h-8 transition-colors hover:bg-orange-50"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

              {/* Appearance */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Appearance</div>
                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: isDark ? "rgba(244,121,32,0.1)" : "rgba(244,121,32,0.05)", border: "1px solid var(--glass-border-subtle)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ width: 36, height: 36, background: isDark ? "rgba(244,121,32,0.2)" : "rgba(30,15,5,0.08)" }}
                    >
                      <span style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Dark Mode</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isDark ? "Dark theme is active" : "Light theme is active"}</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={onToggleDark}
                    className="flex-shrink-0 rounded-full"
                    animate={{ backgroundColor: isDark ? accentColor : "rgba(180,150,120,0.25)" }}
                    style={{ width: 44, height: 24, position: "relative", cursor: "pointer", backgroundColor: isDark ? accentColor : "rgba(180,150,120,0.25)" }}
                  >
                    <motion.div
                      animate={{ x: isDark ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="absolute rounded-full bg-white"
                      style={{ width: 20, height: 20, top: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
                    />
                  </motion.button>
                </div>
              </section>

              <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

              {/* Display */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Display</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Date Format</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>How dates are displayed</div>
                    </div>
                    <select
                      value={appSettings.dateFormat}
                      onChange={e => setAppSettings(s => ({ ...s, dateFormat: e.target.value }))}
                      className="rounded-lg px-3 py-1.5 outline-none"
                      style={{ background: "var(--surface-input)", border: "1px solid var(--glass-border-subtle)", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Items Per Page</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Table pagination size</div>
                    </div>
                    <select
                      value={appSettings.itemsPerPage}
                      onChange={e => setAppSettings(s => ({ ...s, itemsPerPage: e.target.value }))}
                      className="rounded-lg px-3 py-1.5 outline-none"
                      style={{ background: "var(--surface-input)", border: "1px solid var(--glass-border-subtle)", color: "var(--text-primary)", fontSize: 13 }}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <SettingsToggle
                    label="Compact Mode"
                    desc="Reduce spacing in tables and lists"
                    value={appSettings.compactMode}
                    accent={accentColor}
                    onChange={v => setAppSettings(s => ({ ...s, compactMode: v }))}
                  />
                </div>
              </section>

              <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

              {/* Notifications */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Notifications</div>
                <div className="space-y-3">
                  <SettingsToggle label="Email Notifications" desc="Receive updates via email" value={appSettings.emailNotif} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, emailNotif: v }))} />
                  <SettingsToggle label="In-App Notifications" desc="Show notification bell alerts" value={appSettings.inAppNotif} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, inAppNotif: v }))} />
                  <SettingsToggle label="Deadline Reminders" desc="Alert before submission deadlines" value={appSettings.deadlineReminder} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, deadlineReminder: v }))} />
                  <SettingsToggle label="Sound Effects" desc="Play sounds for alerts" value={appSettings.soundEnabled} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, soundEnabled: v }))} />
                </div>
              </section>

              <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

              {/* Privacy */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Privacy</div>
                <div className="space-y-3">
                  <SettingsToggle label="Public Profile" desc="Show your profile to other participants" value={appSettings.showProfilePublic} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, showProfilePublic: v }))} />
                  <SettingsToggle label="Show Team Info" desc="Let others see your team details" value={appSettings.showTeamInfo} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, showTeamInfo: v }))} />
                </div>
              </section>

              <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

              {/* About */}
              <section>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>About</div>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(244,121,32,0.05)", border: "1px solid var(--glass-border-subtle)" }}>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Platform</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>SEAL Hackathon</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Version</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>2.4.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Organization</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>FPT University</span>
                  </div>
                </div>
              </section>

            </div>

            {/* Save button */}
            <div className="flex-shrink-0 px-6 py-4" style={{ borderTop: "1px solid var(--glass-border-subtle)" }}>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => setAppSettingsOpen(false)}
                className="w-full py-3 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(244,121,32,0.4)" }}
              >
                Save & Close
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
