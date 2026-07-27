import { useEffect, useRef, useState } from "react";
import { FileText, Github, Loader, RefreshCw, ShieldAlert } from "lucide-react";
import { COLORS, Button } from "@/components/shared/UIComponents";
import { parseApiError } from "@/lib/api/apiClient";
import {
  formatSyncStatus,
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

// Bang mau cho thanh ngon ngu (brand-neutral, du tuong phan light/dark).
const LANG_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];

// languagesJson = {"Java": bytes, ...} → mang {name, pct} top 6, sap xep giam dan.
function parseLanguages(json?: string): { name: string; pct: number }[] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json) as Record<string, number>;
    const entries = Object.entries(obj).filter(([, v]) => typeof v === "number" && v > 0);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total <= 0) return [];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, v]) => ({ name, pct: Math.round((v / total) * 1000) / 10 }));
  } catch {
    return [];
  }
}

// topContributorsJson = [{login, contributions, avatarUrl}] → mang an toan.
function parseContributors(json?: string): { login: string; contributions: number }[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as { login?: string; contributions?: number }[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(c => c && c.login)
      .map(c => ({ login: c.login as string, contributions: Number(c.contributions ?? 0) }));
  } catch {
    return [];
  }
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: COLORS.textSecondary }}>
        {label}
      </div>
    </div>
  );
}

/**
 * Read-only metadata card duoc dung chung cho Team (detail/preview) va Judge (read-only).
 * Metadata chi la thong tin tham khao — moi so lieu (stars/forks/issues/activity) khong anh huong diem.
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
  const langs = parseLanguages(repository.languagesJson);
  const contributors = parseContributors(repository.topContributorsJson);
  const hasActivity =
    repository.commitCount != null ||
    repository.contributorCount != null ||
    langs.length > 0 ||
    contributors.length > 0;

  // README lazy: chi goi khi nguoi dung mo (tiet kiem rate-limit). undefined = chua tai.
  const [readme, setReadme] = useState<{ loading: boolean; open: boolean; content?: string | null }>({
    loading: false,
    open: false,
  });
  const toggleReadme = async () => {
    if (readme.open) {
      setReadme(r => ({ ...r, open: false }));
      return;
    }
    if (readme.content !== undefined) {
      setReadme(r => ({ ...r, open: true }));
      return;
    }
    if (!repository.submissionId) return;
    setReadme({ loading: true, open: true });
    try {
      const res = await submissionService.getRepositoryReadme(repository.submissionId);
      setReadme({ loading: false, open: true, content: res.content ?? null });
    } catch {
      setReadme({ loading: false, open: true, content: null });
    }
  };

  // Cooldown chong spam nut Resync: sau moi lan bam, khoa nut + dem nguoc (khop cooldown 30s
  // phia server — trong khoang do server tra cache khong goi GitHub).
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const handleRefreshClick = () => {
    if (!onRefresh || refreshing || cooldown > 0) return;
    onRefresh();
    setCooldown(30);
  };
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
            {formatSyncStatus(repository.lastSyncStatus)}
          </span>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              icon={refreshing ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              onClick={handleRefreshClick}
              disabled={!!refreshing || cooldown > 0}
            >
              {refreshing ? "Syncing..." : cooldown > 0 ? `Wait ${cooldown}s` : "Resync"}
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

      {/* Note nho cho Judge: metadata chi la thong tin so luoc, bam Resync de nap ban moi nhat. */}
      {showJudgeDisclaimer && (
        <div
          className="mt-3 rounded-md px-2.5 py-1.5"
          style={{ fontSize: 11, color: COLORS.textSecondary, background: `${COLORS.primary}0f`, border: `1px solid ${COLORS.primary}33` }}
        >
          Quick overview for reference only —{onRefresh ? <> click <strong style={{ color: COLORS.textPrimary }}>Resync</strong> to load the repository's latest version before scoring.</> : " open the repository for the full picture."}
        </div>
      )}

      {/* Development activity: bối cảnh khách quan cho việc chấm (KHÔNG tính điểm). */}
      {hasActivity && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: COLORS.textSecondary, marginBottom: 8 }}>
            Development activity
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {repository.commitCount != null && <ActivityStat label="Commits" value={repository.commitCount} />}
            {repository.contributorCount != null && <ActivityStat label="Contributors" value={repository.contributorCount} />}
          </div>

          {langs.length > 0 && (
            <div className="mb-3">
              {/* Thanh phan bo ngon ngu theo % bytes (top 6). */}
              <div className="flex w-full h-2 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                {langs.map((l, i) => (
                  <div key={l.name} style={{ width: `${l.pct}%`, background: LANG_COLORS[i % LANG_COLORS.length] }} title={`${l.name} ${l.pct}%`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                {langs.map((l, i) => (
                  <span key={l.name} className="inline-flex items-center gap-1" style={{ fontSize: 11, color: COLORS.textSecondary }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: LANG_COLORS[i % LANG_COLORS.length] }} />
                    {l.name} <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{l.pct}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {contributors.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {contributors.slice(0, 5).map(c => (
                <span key={c.login} style={{ fontSize: 11, color: COLORS.textSecondary }}>
                  {c.login} <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{c.contributions.toLocaleString()}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {repository.lastSyncStatus === "FAILED" && repository.errorCode && (
        <div className="mt-2 flex items-center gap-2" style={{ fontSize: 12, color: COLORS.error }}>
          <ShieldAlert size={13} />
          <span>Last sync failed: {repository.errorCode}</span>
        </div>
      )}

      {/* README lazy — chi tai khi mo. Hien dang text (khong them thu vien markdown). */}
      {repository.submissionId && (
        <div className="mt-3">
          <button
            type="button"
            onClick={toggleReadme}
            className="inline-flex items-center gap-1.5"
            style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}
          >
            <FileText size={13} />
            {readme.open ? "Hide README" : "View README"}
            {readme.loading && <Loader size={12} className="animate-spin" />}
          </button>
          {readme.open && !readme.loading && (
            <pre
              className="mt-2 max-h-80 overflow-auto rounded-lg p-3 whitespace-pre-wrap break-words"
              style={{ fontSize: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontFamily: "inherit" }}
            >
              {readme.content ? readme.content : "No README found in this repository."}
            </pre>
          )}
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
