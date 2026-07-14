export const SUBMISSION_URL_FIELDS = [
  "repositoryUrl",
  "demoUrl",
  "reportUrl",
  "slideUrl",
] as const;

export type SubmissionUrlField = typeof SUBMISSION_URL_FIELDS[number];
export type SubmissionUrlErrors = Partial<Record<SubmissionUrlField, string>>;

const URL_MESSAGE = "URL must start with http:// or https://.";
const GITHUB_REPOSITORY_MESSAGE = "Repository URL must be a GitHub repo URL like https://github.com/owner/repo.";
const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]+(?:\.git)?\/?$/i;

export function isOptionalHttpUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  return /^https?:\/\/\S+$/i.test(trimmed);
}

export function isOptionalGithubRepositoryUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  return GITHUB_REPOSITORY_URL_PATTERN.test(trimmed);
}

export function validateSubmissionUrls<T extends Record<string, string | undefined | null>>(values: T) {
  return SUBMISSION_URL_FIELDS.reduce<SubmissionUrlErrors>((errors, field) => {
    if (field === "repositoryUrl") {
      if (!isOptionalGithubRepositoryUrl(values[field])) {
        errors[field] = GITHUB_REPOSITORY_MESSAGE;
      }
      return errors;
    }

    if (!isOptionalHttpUrl(values[field])) {
      errors[field] = URL_MESSAGE;
    }
    return errors;
  }, {});
}

export function hasSubmissionUrlErrors(errors: SubmissionUrlErrors) {
  return Object.keys(errors).length > 0;
}
