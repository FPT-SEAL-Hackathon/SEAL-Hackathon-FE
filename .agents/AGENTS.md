# SEAL Hackathon FE - Agent Rules & Project Lessons Learned

## 1. Frontend Path Variable & String Interpolation Safety
- **Rule**: When building API endpoint URLs containing path parameters (e.g. `/api/v1/admin/submissions/${submissionId}/approve`), ALWAYS use property fallbacks and add guard checks:
  ```typescript
  const subId = row.submissionId || row.id;
  if (!subId || subId === "undefined") {
    console.error("Invalid submissionId");
    return;
  }
  ```
- **Rationale**: If `submissionId` is `undefined`, JavaScript interpolates literal `"undefined"` into the path, triggering `400 BAD_REQUEST - Invalid request parameter` from Spring Boot UUID path parameter parsing.

## 2. API Error Message Extraction (Fetch API vs Axios)
- **Rule**: Extract backend error messages using `e?.message || e?.response?.data?.message || "Default message"`.
- **Rationale**: `apiClient` uses standard `fetch` and throws `ApiError` with `.message` directly on the error object. Accessing `e?.response?.data?.message` (Axios pattern) evaluates to `undefined`, causing error notifications to fall back to generic messages instead of showing backend error details (e.g. *"Only approved teams can create consultation requests"*).

## 3. Data Tables & Empty State Rendering
- **Rule**: Never feed dummy mock objects without valid IDs (e.g., `[{ team: "No submissions...", status: "draft" }]`) into `DataTable`.
- **Rationale**: Dummy items without `submissionId` or `id` cause `subId` to be `undefined`. Conditions like `rejectingId === subId` evaluate `undefined === undefined` to `true`, rendering action forms on non-existent rows. Always render a dedicated empty state card when dataset length is 0.

## 4. Consultation Request Business Logic
- **Rule**: Messaging, milestone addition, and mentor notes editing are strictly allowed ONLY when the consultation request status is `ACCEPTED` or `IN_PROGRESS`.
- Display helpful status banners when request status is `PENDING`.
