import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Users, Save, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { eventService, type EventResponse, type CreateEventRequest } from "@/features/events/api/eventService";
import { ApiError } from "@/lib/api/apiClient";
import { COLORS } from "@/components/shared/UIComponents";

interface Props {
  event?: EventResponse | null;
  onClose: () => void;
  onSaved: (event: EventResponse) => void;
}

// Event status IDs — these need to match your backend seed data UUIDs
// Using placeholder values; replace with real UUIDs from your DB
const STATUS_OPTIONS = [
  { label: "Draft", value: "30000000-0000-0000-0000-000000000001" },
  { label: "Registration Open", value: "30000000-0000-0000-0000-000000000002" },
  { label: "Ongoing", value: "30000000-0000-0000-0000-000000000003" },
  { label: "Completed", value: "30000000-0000-0000-0000-000000000004" },
  { label: "Cancelled", value: "30000000-0000-0000-0000-000000000005" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
      style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
    />
  );
}

const formatDateTime = (value: string) => {
    return value ? `${value}:00` : undefined;
};

export function EventModal({ event, onClose, onSaved }: Props) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    eventName: event?.eventName ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    bannerImageUrl: event?.bannerImageUrl ?? "",
    eventStatusId: event?.eventStatus?.eventStatusId ?? STATUS_OPTIONS[0].value,
    registrationStart: event?.registrationStart?.slice(0, 16) ?? "",
    registrationEnd: event?.registrationEnd?.slice(0, 16) ?? "",
    eventStartDate: event?.eventStartDate ?? "",
    eventEndDate: event?.eventEndDate ?? "",
    maxTeamSize: String(event?.maxTeamSize ?? 5),
    minTeamSize: String(event?.minTeamSize ?? 2),
  });

  useEffect(() => {
    if (!event) return;

    setForm({
      eventName: event.eventName ?? "",
      description: event.description ?? "",
      location: event.location ?? "",
      bannerImageUrl: event.bannerImageUrl ?? "",

      eventStatusId:
        event.eventStatus?.eventStatusId ??
        STATUS_OPTIONS[0].value,

      registrationStart:
        event.registrationStart?.slice(0,16) ?? "",

      registrationEnd:
        event.registrationEnd?.slice(0,16) ?? "",

      eventStartDate:
        event.eventStartDate ?? "",

      eventEndDate:
        event.eventEndDate ?? "",

      maxTeamSize:
        String(event.maxTeamSize ?? 5),

      minTeamSize:
        String(event.minTeamSize ?? 2),
    });

  }, [event]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.eventName.trim()) { setError("Event name is required."); return; }
    setLoading(true); setError("");
    try {
      const payload: CreateEventRequest = {
        eventName: form.eventName,
        description: form.description || undefined,
        location: form.location || undefined,
        bannerImageUrl: form.bannerImageUrl || undefined,
        eventStatusId: form.eventStatusId,
        registrationStart: formatDateTime(form.registrationStart),
        registrationEnd: formatDateTime(form.registrationEnd),
        eventStartDate: form.eventStartDate || undefined,
        eventEndDate: form.eventEndDate || undefined,
        maxTeamSize: parseInt(form.maxTeamSize) || undefined,
        minTeamSize: parseInt(form.minTeamSize) || undefined,
      };
      const result = isEdit
        ? await eventService.update(event!.eventId, { ...payload, eventName: payload.eventName, eventStatusId: payload.eventStatusId! })
        : await eventService.create(payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full rounded-2xl overflow-hidden"
          style={{ maxWidth: 620, background: COLORS.bg, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>
              {isEdit ? "Edit Event" : "Create New Event"}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} style={{ color: COLORS.textSecondary }} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30`, color: COLORS.error }}>
                {error}
              </div>
            )}

            <Field label="Event Name *">
              <Input value={form.eventName} onChange={v => set("eventName", v)} placeholder="SEAL Hackathon 2026" />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Brief description of the event..."
                rows={3} className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Location">
                <Input value={form.location} onChange={v => set("location", v)} placeholder="FPT University, Hanoi" />
              </Field>
              <Field label="Status">
                <select value={form.eventStatusId} onChange={e => set("eventStatusId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Registration Start">
                <Input type="datetime-local" value={form.registrationStart} onChange={v => set("registrationStart", v)} />
              </Field>
              <Field label="Registration End">
                <Input type="datetime-local" value={form.registrationEnd} onChange={v => set("registrationEnd", v)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Event Start Date">
                <Input type="date" value={form.eventStartDate} onChange={v => set("eventStartDate", v)} />
              </Field>
              <Field label="Event End Date">
                <Input type="date" value={form.eventEndDate} onChange={v => set("eventEndDate", v)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Team Size">
                <Input type="number" value={form.minTeamSize} onChange={v => set("minTeamSize", v)} placeholder="2" />
              </Field>
              <Field label="Max Team Size">
                <Input type="number" value={form.maxTeamSize} onChange={v => set("maxTeamSize", v)} placeholder="5" />
              </Field>
            </div>

            <Field label="Banner Image URL">
              <Input value={form.bannerImageUrl} onChange={v => set("bannerImageUrl", v)} placeholder="https://..." />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
