import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, Send,
} from "lucide-react";
import {
  Card, SectionHeader, COLORS, StatusBadge,
  Button,
} from "@/components/shared/UIComponents";

interface AdminViewProps {
  context: any;
}

export function AdminNotificationsView({ context }: AdminViewProps) {
  const {
    t,
    onNavigate,
    broadcastHistory,
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
    broadcastAudience,
    setBroadcastAudience,
    broadcastSent,
    handleBroadcast,
  } = context;

  return (
    <>
      <SectionHeader
        title={t("admin.notificationCenter")}
        subtitle={t("admin.notificationSubtitle")}
        action={
          <Button variant="outline" size="sm" icon={<Send size={14} />} onClick={() => onNavigate("direct-notification")}>
            Direct Notification
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Send Broadcast */}
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.broadcastSend")}</div>
          <div className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.audience")}</label>
              <Select value={broadcastAudience || "none"} onValueChange={value => setBroadcastAudience((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Teams</SelectItem>
                <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Judges</SelectItem>
                <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Mentors</SelectItem>
                <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Participants</SelectItem>
  </SelectContent>
</Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.titleLabel")}</label>
              <input
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder={t("broadcast.titlePlaceholder")}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.message")}</label>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={5}
                placeholder={t("broadcast.messagePlaceholder")}
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Send size={14} />}
                onClick={handleBroadcast}
                disabled={!broadcastTitle || !broadcastMessage}
              >
                {t("common.sendBroadcast")}
              </Button>
              {broadcastSent && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{t("common.broadcastSent")}</span>}
            </div>
          </div>
        </Card>

        {/* Broadcast History */}
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.broadcastHistory")}</div>
          {broadcastHistory.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}` }}>
              <Bell size={28} className="mx-auto mb-2" style={{ color: COLORS.border }} />
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No broadcasts sent yet. Send a broadcast to see it here.</div>
            </div>
          ) : (
            broadcastHistory.map((b: any) => (
              <div key={b.id} className="mb-4 p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{b.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{b.message}</div>
                <div className="flex items-center justify-between mt-2">
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                    {[b.audience, b.sent, typeof b.recipientCount === "number" ? `${b.recipientCount} recipient${b.recipientCount !== 1 ? "s" : ""}` : null]
                      .filter(Boolean).join(" · ")}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}
