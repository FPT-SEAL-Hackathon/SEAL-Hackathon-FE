import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Users, Save, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { eventService, type EventResponse, type CreateEventRequest } from "@/features/events/api/eventService";
import { parseApiError } from "@/lib/api/apiClient";
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: error ? COLORS.error : COLORS.textSecondary, display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>
        {label.toUpperCase()}
      </label>
      {children}
      {error && <div style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", error }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: boolean }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
      style={{ fontSize: 14, border: `1px solid ${error ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
    />
  );
}

const formatDateTime = (value: string) => {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
};

const requiredMessage = (label: string) => `${label} is required.`;

function validateEventForm(form: {
  eventName: string;
  location: string;
  registrationStart: string;
  registrationEnd: string;
  eventStartDate: string;
  eventEndDate: string;
  minTeamSize: string;
  maxTeamSize: string;
}) {
  const errors: Record<string, string> = {};
  const minTeamSize = Number(form.minTeamSize);
  const maxTeamSize = Number(form.maxTeamSize);

  if (!form.eventName.trim()) errors.eventName = requiredMessage("Event name");
  if (!form.location.trim()) errors.location = requiredMessage("Location");
  if (!form.registrationStart) errors.registrationStart = requiredMessage("Registration start");
  if (!form.registrationEnd) errors.registrationEnd = requiredMessage("Registration end");
  if (!form.eventStartDate) errors.eventStartDate = requiredMessage("Event start date");
  if (!form.eventEndDate) errors.eventEndDate = requiredMessage("Event end date");

  if (!form.minTeamSize) {
    errors.minTeamSize = requiredMessage("Min team size");
  } else if (!Number.isFinite(minTeamSize) || minTeamSize < 1) {
    errors.minTeamSize = "Min team size must be at least 1.";
  }

  if (!form.maxTeamSize) {
    errors.maxTeamSize = requiredMessage("Max team size");
  } else if (!Number.isFinite(maxTeamSize) || maxTeamSize < 1) {
    errors.maxTeamSize = "Max team size must be at least 1.";
  }

  if (!errors.minTeamSize && !errors.maxTeamSize && minTeamSize > maxTeamSize) {
    errors.minTeamSize = "Min team size cannot exceed max team size.";
    errors.maxTeamSize = "Max team size cannot be less than min team size.";
  }

  if (form.registrationStart && form.registrationEnd && form.registrationStart > form.registrationEnd) {
    errors.registrationEnd = "Registration end must be after or equal to registration start.";
  }

  if (form.eventStartDate && form.eventEndDate && form.eventStartDate > form.eventEndDate) {
    errors.eventEndDate = "Event end date must be after or equal to event start date.";
  }

  if (form.registrationEnd && form.eventStartDate && form.registrationEnd.slice(0, 10) > form.eventStartDate) {
    errors.registrationEnd = "Registration end date cannot be after event start date.";
  }

  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (fieldErrors[k]) {
      setFieldErrors(prev => ({ ...prev, [k]: "" }));
    }
  };

  const handleSave = async () => {
    const errors = validateEventForm(form);
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length > 0) return;

    setLoading(true); setError("");
    const minTeamSize = Number(form.minTeamSize);
    const maxTeamSize = Number(form.maxTeamSize);
    try {
      const payload: CreateEventRequest = {
        eventName: form.eventName.trim(),
        description: form.description || undefined,
        location: form.location.trim(),
        bannerImageUrl: form.bannerImageUrl || undefined,
        eventStatusId: form.eventStatusId,
        registrationStart: formatDateTime(form.registrationStart),
        registrationEnd: formatDateTime(form.registrationEnd),
        eventStartDate: form.eventStartDate,
        eventEndDate: form.eventEndDate,
        maxTeamSize,
        minTeamSize,
      };
      const result = isEdit
        ? await eventService.update(event!.eventId, { ...payload, eventName: payload.eventName, eventStatusId: payload.eventStatusId! })
        : await eventService.create(payload);
      toast.success(isEdit ? "Event updated successfully." : "Event created successfully.");
      onSaved(result);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors ?? {});
      setError(parsed.message);
      toast.error(parsed.message);
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

            <Field label="Event Name *" error={fieldErrors.eventName}>
              <Input value={form.eventName} onChange={v => set("eventName", v)} placeholder="SEAL Hackathon 2026" error={!!fieldErrors.eventName} />
            </Field>

            <Field label="Description" error={fieldErrors.description}>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Brief description of the event..."
                rows={3} className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${fieldErrors.description ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Location" error={fieldErrors.location}>
                <Input value={form.location} onChange={v => set("location", v)} placeholder="FPT University, Hanoi" error={!!fieldErrors.location} />
              </Field>
              <Field label="Status" error={fieldErrors.eventStatusId}>
                <select value={form.eventStatusId} onChange={e => set("eventStatusId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${fieldErrors.eventStatusId ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Registration Start" error={fieldErrors.registrationStart}>
                <Input type="datetime-local" value={form.registrationStart} onChange={v => set("registrationStart", v)} error={!!fieldErrors.registrationStart} />
              </Field>
              <Field label="Registration End" error={fieldErrors.registrationEnd}>
                <Input type="datetime-local" value={form.registrationEnd} onChange={v => set("registrationEnd", v)} error={!!fieldErrors.registrationEnd} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Event Start Date" error={fieldErrors.eventStartDate}>
                <Input type="date" value={form.eventStartDate} onChange={v => set("eventStartDate", v)} error={!!fieldErrors.eventStartDate} />
              </Field>
              <Field label="Event End Date" error={fieldErrors.eventEndDate}>
                <Input type="date" value={form.eventEndDate} onChange={v => set("eventEndDate", v)} error={!!fieldErrors.eventEndDate} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Team Size" error={fieldErrors.minTeamSize}>
                <Input type="number" value={form.minTeamSize} onChange={v => set("minTeamSize", v)} placeholder="2" error={!!fieldErrors.minTeamSize} />
              </Field>
              <Field label="Max Team Size" error={fieldErrors.maxTeamSize}>
                <Input type="number" value={form.maxTeamSize} onChange={v => set("maxTeamSize", v)} placeholder="5" error={!!fieldErrors.maxTeamSize} />
              </Field>
            </div>

            <Field label="Banner Image URL" error={fieldErrors.bannerImageUrl}>
              <Input value={form.bannerImageUrl} onChange={v => set("bannerImageUrl", v)} placeholder="https://..." error={!!fieldErrors.bannerImageUrl} />
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
