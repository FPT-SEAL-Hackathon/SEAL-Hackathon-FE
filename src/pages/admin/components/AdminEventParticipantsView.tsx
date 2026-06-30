import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle, Loader, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import {
  EVENT_PARTICIPANT_STATUSES,
  eventParticipantService,
  type EventParticipantResponse,
  type EventParticipantStatus,
} from "@/features/eventParticipants/api/eventParticipantService";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function labelStatus(status: string) {
  if (status === "ACTIVE") return "Approved";
  if (status === "PENDING") return "Pending";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function isPendingStatus(status: EventParticipantStatus) {
  return status === "PENDING";
}

function participantBadgeStatus(status: EventParticipantStatus) {
  if (status === "ACTIVE") return "approved";
  return normalizeStatus(status);
}

function participantId(row: EventParticipantResponse) {
  return row.participantId ?? row.eventParticipantId ?? "";
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function getStudentCode(row: EventParticipantResponse) {
  return row.studentCode || row.fptStudentCode || row.externalStudentCode || "-";
}

function getUniversity(row: EventParticipantResponse) {
  return row.university || row.universityName || "-";
}

function getApprovedBy(row: EventParticipantResponse) {
  return row.approvedByName || row.approvedBy || "-";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";
}

export function AdminEventParticipantsView() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [rows, setRows] = useState<EventParticipantResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    eventId: new URLSearchParams(window.location.search).get("eventId") ?? "",
    categoryId: new URLSearchParams(window.location.search).get("categoryId") ?? "",
    status: new URLSearchParams(window.location.search).get("status") ?? "",
    keyword: new URLSearchParams(window.location.search).get("keyword") ?? "",
    university: new URLSearchParams(window.location.search).get("university") ?? "",
    page: Number(new URLSearchParams(window.location.search).get("page") ?? "0"),
    size: Number(new URLSearchParams(window.location.search).get("size") ?? "10"),
    sortBy: new URLSearchParams(window.location.search).get("sortBy") ?? "appliedAt",
    sortDirection: (new URLSearchParams(window.location.search).get("sortDirection") as "asc" | "desc") ?? "desc",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [bulkStatus, setBulkStatus] = useState<EventParticipantStatus>("ACTIVE");
  const [rejectTarget, setRejectTarget] = useState<{ ids: string[]; status: EventParticipantStatus } | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");

  const allVisibleSelected = rows.length > 0 && rows.every(row => selectedIds.includes(participantId(row)));
  const selectedCount = selectedIds.length;

  const universities = useMemo(() => {
    const values = rows.map(getUniversity).filter(value => value !== "-");
    return Array.from(new Set(values));
  }, [rows]);

  const setFilter = (key: keyof typeof filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === "page" ? Number(value) : 0 }));
  };

  const loadParticipants = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const page = await eventParticipantService.getOrganizerParticipants({
        ...filters,
        status: filters.status || undefined,
        eventId: filters.eventId || undefined,
        categoryId: filters.categoryId || undefined,
        keyword: filters.keyword || undefined,
        university: filters.university || undefined,
      });
      setRows(page.content);
      setTotalPages(Math.max(page.totalPages, 1));
      setTotalElements(page.totalElements);
      setSelectedIds(prev => prev.filter(id => page.content.some(row => participantId(row) === id)));
    } catch (error) {
      setRows([]);
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Failed to load event participants." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    eventService.getAll().then(setEvents).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (!filters.eventId) {
      setCategories([]);
      return;
    }
    categoryService.getByEvent(filters.eventId).then(setCategories).catch(() => setCategories([]));
  }, [filters.eventId]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAllVisible = () => {
    const visibleIds = rows.map(participantId).filter(Boolean);
    setSelectedIds(prev => allVisibleSelected ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  };

  const applyStatus = async (ids: string[], status: EventParticipantStatus, reason?: string) => {
    if (ids.length === 0) return;
    if (status === "REJECTED" && !reason && !rejectTarget) {
      setRejectTarget({ ids, status });
      return;
    }
    if (!window.confirm(`Apply ${labelStatus(status)} to ${ids.length} participant(s)?`)) return;
    setMutating(true);
    setMessage(null);
    try {
      if (ids.length === 1) {
        await eventParticipantService.updateStatus(ids[0], status, reason);
      } else {
        await eventParticipantService.bulkUpdateStatus(ids, status, reason);
      }
      const successText = status === "ACTIVE"
        ? "User approved successfully"
        : status === "REJECTED"
          ? "User rejected successfully"
          : "Participant status updated.";
      setMessage({ tone: "success", text: successText });
      toast.success(successText);
      setRejectTarget(null);
      setRejectedReason("");
      await loadParticipants();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Failed to update participant status.";
      setMessage({ tone: "error", text: errorText });
      toast.error(errorText);
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Event Participants"
        subtitle="Approve and manage participant status per event."
        action={<Button variant="outline" size="sm" icon={loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />} onClick={loadParticipants} disabled={loading}>Refresh</Button>}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <FilterSelect label="Event" value={filters.eventId} onChange={value => setFilter("eventId", value)}>
            <option value="">All events</option>
            {events.map(event => <option key={event.eventId} value={event.eventId}>{event.eventName}</option>)}
          </FilterSelect>
          <FilterSelect label="Category" value={filters.categoryId} onChange={value => setFilter("categoryId", value)} disabled={!filters.eventId}>
            <option value="">All categories</option>
            {categories.map(category => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={filters.status} onChange={value => setFilter("status", value)}>
            <option value="">All statuses</option>
            {EVENT_PARTICIPANT_STATUSES.map(status => <option key={status} value={status}>{labelStatus(status)}</option>)}
          </FilterSelect>
          <FilterSelect label="University" value={filters.university} onChange={value => setFilter("university", value)}>
            <option value="">All universities</option>
            {universities.map(university => <option key={university} value={university}>{university}</option>)}
          </FilterSelect>
          <FilterInput label="Keyword" value={filters.keyword} onChange={value => setFilter("keyword", value)} placeholder="Name, email, code" />
          <FilterSelect label="Page Size" value={String(filters.size)} onChange={value => setFilter("size", Number(value))}>
            {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
          </FilterSelect>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <FilterSelect label="Sort By" value={filters.sortBy} onChange={value => setFilter("sortBy", value)}>
            <option value="appliedAt">Applied At</option>
            <option value="approvedAt">Approved At</option>
            <option value="fullName">Full Name</option>
            <option value="status">Status</option>
            <option value="eventName">Event</option>
          </FilterSelect>
          <FilterSelect label="Direction" value={filters.sortDirection} onChange={value => setFilter("sortDirection", value as "asc" | "desc")}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </FilterSelect>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>Bulk Actions</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
              {selectedCount} selected of {totalElements} participant(s)
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="Bulk Action" value={bulkStatus} onChange={value => setBulkStatus(value as EventParticipantStatus)}>
              {EVENT_PARTICIPANT_STATUSES.map(status => <option key={status} value={status}>{labelStatus(status)}</option>)}
            </FilterSelect>
            <Button
              variant={bulkStatus === "REJECTED" ? "danger" : "primary"}
              size="md"
              icon={mutating ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              disabled={selectedIds.length === 0 || mutating}
              onClick={() => applyStatus(selectedIds, bulkStatus)}
            >
              Apply
            </Button>
          </div>
        </div>
        {message && (
          <div className="mt-4 px-3 py-2 rounded-xl" style={{
            fontSize: 13,
            color: message.tone === "success" ? COLORS.success : message.tone === "error" ? COLORS.error : COLORS.textSecondary,
            background: message.tone === "success" ? `${COLORS.success}10` : message.tone === "error" ? `${COLORS.error}10` : COLORS.bg,
            border: `1px solid ${message.tone === "success" ? COLORS.success : message.tone === "error" ? COLORS.error : COLORS.border}25`,
          }}>
            {message.text}
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 1280 }}>
            <thead>
              <tr style={{ background: "rgba(244,121,32,0.04)" }}>
                <Th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></Th>
                {["Avatar", "Full Name", "Student Code", "University", "Email", "Event", "Category", "Current Status", "Applied At", "Approved At", "Approved By", "Action"].map(header => <Th key={header}>{header}</Th>)}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={12} className="px-4 py-10 text-center" style={{ color: COLORS.textSecondary }}><Loader size={18} className="animate-spin inline-block mr-2" />Loading participants...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-12 text-center" style={{ color: COLORS.textSecondary }}><Users size={22} className="inline-block mr-2" />No participants found.</td></tr>
              )}
              {!loading && rows.map(row => {
                const id = participantId(row);
                return (
                  <tr key={id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <Td><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} /></Td>
                    <Td>
                      {row.avatarUrl ? (
                        <img src={row.avatarUrl} alt="" className="rounded-full" style={{ width: 32, height: 32, objectFit: "cover" }} />
                      ) : (
                        <div className="rounded-full flex items-center justify-center text-white" style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, fontSize: 11, fontWeight: 800 }}>{initials(row.fullName)}</div>
                      )}
                    </Td>
                    <Td strong>{row.fullName}</Td>
                    <Td>{getStudentCode(row)}</Td>
                    <Td>{getUniversity(row)}</Td>
                    <Td>{row.email}</Td>
                    <Td>{row.eventName}</Td>
                    <Td>{row.categoryName || "-"}</Td>
                    <Td><StatusBadge status={participantBadgeStatus(row.status)} /></Td>
                    <Td>{formatDate(row.appliedAt ?? row.registeredAt)}</Td>
                    <Td>{formatDate(row.approvedAt)}</Td>
                    <Td>{getApprovedBy(row)}</Td>
                    <Td>
                      {isPendingStatus(row.status) ? (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={mutating}
                            onClick={() => applyStatus([id], "ACTIVE")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={mutating}
                            onClick={() => setRejectTarget({ ids: [id], status: "REJECTED" })}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>No pending action</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="ghost" size="sm" disabled={filters.page <= 0 || loading} onClick={() => setFilter("page", Math.max(filters.page - 1, 0))}>Previous</Button>
          <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Page {filters.page + 1} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={filters.page + 1 >= totalPages || loading} onClick={() => setFilter("page", filters.page + 1)}>Next</Button>
        </div>
      </Card>

      {rejectTarget && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(30,15,5,0.28)", zIndex: 70 }}>
          <Card className="p-5" style={{ width: "min(520px, 100%)" }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>Reject Participant</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>Rejected reason is optional unless the backend requires it.</div>
            <textarea
              value={rejectedReason}
              onChange={event => setRejectedReason(event.target.value)}
              rows={4}
              className="w-full mt-4 px-3 py-2 rounded-xl outline-none resize-none"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 14 }}
              placeholder="Rejected reason"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" size="md" disabled={mutating} onClick={() => { setRejectTarget(null); setRejectedReason(""); }}>Cancel</Button>
              <Button variant="danger" size="md" disabled={mutating} onClick={() => applyStatus(rejectTarget.ids, rejectTarget.status, rejectedReason)}>
                {mutating ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13 }} />
    </label>
  );
}

function FilterSelect({ label, value, onChange, children, disabled }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="block min-w-[150px]">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <select disabled={disabled} value={value} onChange={event => onChange(event.target.value)} className="w-full px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13, opacity: disabled ? 0.5 : 1 }}>
        {children}
      </select>
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="text-left px-4 py-3" style={{ fontSize: 10, fontWeight: 800, color: "#a07850", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: strong ? 700 : 400, whiteSpace: "nowrap" }}>{children}</td>;
}
