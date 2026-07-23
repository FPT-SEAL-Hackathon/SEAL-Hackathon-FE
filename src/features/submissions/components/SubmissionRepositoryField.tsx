import { useEffect, useRef, useState } from "react";
import { Github, Loader, RefreshCw, ShieldAlert } from "lucide-react";
import { COLORS, Button } from "@/components/shared/UIComponents";
import { parseApiError } from "@/lib/api/apiClient";
import {
  submissionService,
  type SubmissionRepositoryResponse,
} from "@/features/submissions/api/submissionService";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function syncStatusColor(status?: string): string {
  switch ((status ?? "").toUpperCase()) {
    case "SUCCESS":
      return COLORS.success;
    case "FAILED":
      return COLORS.error;
    case "RUNNING":
      return COLORS.textSecondary;
    default:
      return COLORS.textSecondary;
  }
}

function MetadataRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-baseline gap-2" style={{ fontSize: 12 }}>
      <span style={{ fontWeight: 600, color: COLORS.textSecondary, minWidth: 110 }}>{label}</span>
      <span style={{ color: COLORS.textPrimary, wordBreak: "break-word" }}>
        {value === null || value === undefined || value === "" ? "—" : value}
      </span>
    </div>
  );
}

/**
 * Read-only metadata card duoc dung chung cho Team (detail/preview) va Judge (read-only).
 * Metadata chi la thong tin tham khao — moi so lieu (stars/forks/issues) khong anh huong diem.
 */
export function RepositoryMetadataCard({
  repository,
  onRefresh,
  refreshing,
  showJudgeDisclaimer,
}: {
  repository: SubmissionRepositoryResponse;
  /** Chi truyen khi nguoi xem duoc phep resync (Team khi editable / Organizer). */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Judge view: hien disclaimer metadata khong quyet dinh diem. */
  showJudgeDisclaimer?: boolean;
}) {
  const link = repository.externalUrl || repository.repositoryUrl;
  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Github size={16} />
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, textDecoration: "underline" }}
          >
            {repository.fullName || repository.repositoryUrl}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, fontWeight: 700, color: syncStatusColor(repository.lastSyncStatus) }}>
            {repository.lastSyncStatus || "NOT_SYNCHRONIZED"}
          </span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              icon={refreshing ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              onClick={onRefresh}
              disabled={!!refreshing}
            >
              {refreshing ? "Syncing..." : "Refresh"}
            </Button>
          )}
        </div>
      </div>

      {repository.description && (
        <div className="mt-2" style={{ fontSize: 12, color: COLORS.textSecondary }}>{repository.description}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-3">
        <MetadataRow label="Language" value={repository.primaryLanguage} />
        <MetadataRow label="Default branch" value={repository.defaultBranch} />
        <MetadataRow label="Visibility" value={repository.visibility} />
        <MetadataRow label="Last push" value={formatDateTime(repository.lastPushedAt)} />
        <MetadataRow label="Stars" value={repository.starCount} />
        <MetadataRow label="Forks" value={repository.forkCount} />
        <MetadataRow label="Open issues" value={repository.openIssuesCount} />
        <MetadataRow label="Last synchronized" value={formatDateTime(repository.lastSynchronizedAt)} />
      </div>

      {repository.lastSyncStatus === "FAILED" && repository.errorCode && (
        <div className="mt-2 flex items-center gap-2" style={{ fontSize: 12, color: COLORS.error }}>
          <ShieldAlert size={13} />
          <span>Last sync failed: {repository.errorCode}</span>
        </div>
      )}

      {showJudgeDisclaimer && (
        <div className="mt-3 rounded-lg p-2" style={{ fontSize: 11, color: COLORS.textSecondary, border: `1px dashed ${COLORS.border}` }}>
          Repository metadata is supporting information only and does not determine the submission score.
          Judges must evaluate using the official criteria.
        </div>
      )}
    </div>
  );
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

/**
 * O nhap Repository URL cua Team + nut Validate goi
 * POST /api/v1/submissions/repository/validate (preview, KHONG persist).
 * Preview chi mang tinh tham khao: khi submit, FE chi gui repositoryUrl,
 * backend luon fetch lai metadata — metadata tu FE khong bao gio duoc tin.
 */
export function SubmissionRepositoryField({
  value,
  onChange,
  error,
  editable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  editable?: boolean;
}) {
  const [state, setState] = useState<ValidationState>("idle");
  const [preview, setPreview] = useState<SubmissionRepositoryResponse | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  // Chan set-state sau khi unmount (request validate co the cham).
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // URL doi thi preview cu khong con dung — xoa de khong hien metadata sai repo.
  const handleChange = (next: string) => {
    onChange(next);
    setState("idle");
    setPreview(null);
    setValidationError("");
  };

  const handleValidate = async () => {
    if (!value.trim()) {
      setState("invalid");
      setValidationError("Enter a repository URL first.");
      return;
    }
    setState("validating");
    setValidationError("");
    try {
      const metadata = await submissionService.validateRepositoryUrl(value.trim());
      if (!mountedRef.current) return;
      setPreview(metadata);
      setState("valid");
    } catch (err) {
      if (!mountedRef.current) return;
      const parsed = parseApiError(err);
      setPreview(null);
      setState("invalid");
      setValidationError(parsed.message || "Repository validation failed.");
    }
  };

  return (
    <label className="block md:col-span-2">
      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Repository URL</span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ border: `1px solid ${error ? COLORS.error : COLORS.border}`, background: COLORS.bg }}>
          <Github size={14} />
          <input
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: 14, color: COLORS.textPrimary }}
            placeholder="https://github.com/owner/repository"
            value={value}
            onChange={event => handleChange(event.target.value)}
            disabled={!editable}
          />
        </div>
        <Button
          variant="outline"
          size="md"
          icon={state === "validating" ? <Loader size={14} className="animate-spin" /> : <Github size={14} />}
          onClick={handleValidate}
          disabled={!editable || state === "validating" || !value.trim()}
        >
          {state === "validating" ? "Validating..." : "Validate"}
        </Button>
      </div>
      {error && <div className="mt-1" style={{ fontSize: 12, color: COLORS.error }}>{error}</div>}
      {state === "invalid" && validationError && (
        <div className="mt-1" style={{ fontSize: 12, color: COLORS.error }}>{validationError}</div>
      )}
      {state === "valid" && preview && (
        <div className="mt-2">
          <RepositoryMetadataCard repository={preview} />
        </div>
      )}
    </label>
  );
}
