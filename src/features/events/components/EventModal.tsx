import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Users, Save, Loader } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { eventService, type EventResponse, type CreateEventRequest } from "@/features/events/api/eventService";
import { ApiError, parseApiError } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { COLORS } from "@/components/shared/UIComponents";
import { DatePickerField, DateTimePickerField } from "../shared/ui/shared";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";
import { uploadImageToCloudinary } from "@/utils/cloudinary";

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
  { label: "Upcoming", value: "30000000-0000-0000-0000-000000000006"},
  { label: "Registration Closed", value: "30000000-0000-0000-0000-000000000007"}
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
    if (!value) return undefined;
    if (value.length === 16) return `${value}:00`;
    return value;
};

export function EventModal({ event, onClose, onSaved }: Props) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    eventName: event?.eventName ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    bannerImageUrl: event?.bannerImageUrl ?? "",
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

      // eventStatusId:
      //   (typeof event.eventStatus === 'object' ? event.eventStatus?.eventStatusId : event.eventStatus) ??
      //   STATUS_OPTIONS[0].value,

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
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
        setCropperOpen(true);
      });
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(croppedBlob);
      set("bannerImageUrl", url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.eventName.trim()) { setError("Event name is required."); return; }
    
    if (form.registrationStart && form.registrationEnd && form.registrationStart >= form.registrationEnd) {
      setError("Registration End time must be after Registration Start time.");
      return;
    }
    if (form.eventStartDate && form.eventEndDate && form.eventStartDate > form.eventEndDate) {
      setError("Event End Date must be after or equal to Event Start Date.");
      return;
    }
    if (form.registrationEnd && form.eventStartDate) {
      const regEndDate = form.registrationEnd.substring(0, 10);
      if (regEndDate > form.eventStartDate) {
        setError("Registration End date must be on or before Event Start Date.");
        return;
      }
    }

    setLoading(true); setError("");
    try {
      const payload: any = {
        eventName: form.eventName,
        description: form.description || "",
        location: form.location || "",
        bannerImageUrl: form.bannerImageUrl || "",
        registrationStart: formatDateTime(form.registrationStart) ?? "",
        registrationEnd: formatDateTime(form.registrationEnd) ?? "",
        eventStartDate: form.eventStartDate || "",
        eventEndDate: form.eventEndDate || "",
        maxTeamSize: parseInt(form.maxTeamSize) || 5,
        minTeamSize: parseInt(form.minTeamSize) || 2,
      };
      const result = isEdit
        ? await eventService.update(event!.eventId, payload )
        : await eventService.create(payload);
      onSaved(result);
    } catch (err) {
      const parsedMsg = parseApiError(err).message;
      if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        const errorMessages = Object.entries(err.fieldErrors)
          .map(([field, msg]) => `• ${msg}`)
          .join("\n");
        const fullMsg = parsedMsg + "\n" + errorMessages;
        setError(fullMsg);
        toast.error(parsedMsg);
      } else {
        setError(parsedMsg);
        toast.error(parsedMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      >
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
              <div className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30`, color: COLORS.error }}>
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
              {isEdit && (
                <Field label="Current Status">
                  <div
                    className="px-3 py-2.5 rounded-xl"
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      background: `${COLORS.primary}10`,
                      color: COLORS.primary,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {typeof event?.eventStatus === "object"
                      ? event.eventStatus.eventStatusName
                      : event?.eventStatus}
                  </div>
                </Field>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Registration Start">
                <DateTimePickerField
                  value={form.registrationStart}
                  onChange={v => set("registrationStart", v)}
                  minDateTime={!isEdit ? new Date() : undefined}
                  maxDateTime={form.registrationEnd || undefined}
                  strictMax={!!form.registrationEnd}
                />
              </Field>
              <Field label="Registration End">
                <DateTimePickerField
                  value={form.registrationEnd}
                  onChange={v => set("registrationEnd", v)}
                  minDateTime={form.registrationStart || (!isEdit ? new Date() : undefined)}
                  strictMin={!!form.registrationStart}
                  maxDateTime={undefined}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Event Start Date">
                <DatePickerField
                  value={form.eventStartDate}
                  onChange={v => set("eventStartDate", v)}
                  minDate={!isEdit ? new Date() : undefined}
                  maxDate={form.eventEndDate}
                />
              </Field>
              <Field label="Event End Date">
                <DatePickerField
                  value={form.eventEndDate}
                  onChange={v => set("eventEndDate", v)}
                  minDate={form.eventStartDate || (!isEdit ? new Date() : undefined)}
                />
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

            <Field label="Banner Image">
              <div className="flex items-center gap-4">
                {form.bannerImageUrl ? (
                  <div className="relative w-32 h-16 rounded overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
                    <img src={form.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
                    <button onClick={() => set("bannerImageUrl", "")} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1" type="button">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-32 h-16 rounded cursor-pointer border-2 border-dashed transition-colors" style={{ borderColor: COLORS.border, background: `${COLORS.primary}10`, color: COLORS.primary }}>
                    {uploadingImage ? <Loader className="animate-spin" size={20} /> : <span className="text-xs font-semibold">Upload</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={uploadingImage} />
                  </label>
                )}
                <div className="flex-1">
                  <Input value={form.bannerImageUrl} onChange={v => set("bannerImageUrl", v)} placeholder="Or paste image URL here..." />
                </div>
              </div>
            </Field>
          </div>

<ImageCropperModal
              isOpen={cropperOpen}
              onClose={() => setCropperOpen(false)}
              imageSrc={imageSrc}
              onCropComplete={handleCropComplete}
              aspectRatio={16 / 9}
            />
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
