# AI LOG - SEAL Hackathon Development & Fix History

## Session Summary - Consultation Requests, LazyInit & Frontend Guard Fixes

### 1. Business Logic Rules for Consultation Requests
- **Requirement**: Restricted consultation request actions so messaging, milestone creation, and mentor note editing are ONLY allowed when request status is `ACCEPTED` or `IN_PROGRESS`.
- **Backend**:
  - `ConsultationServiceImpl.java`: `sendMessage()` and `updateTeamMentorNote()` throw `BAD_REQUEST` if status is `PENDING`, `REJECTED`, or `CANCELLED`.
  - `MilestoneService.java`: `create()` throws `BAD_REQUEST` if status is not `ACCEPTED` or `IN_PROGRESS`.
- **Frontend**:
  - `TeamConsultations.tsx`: Disabled message composer when status is `PENDING` and added status notice banner: *"⏳ Waiting for an expert to accept this request before messaging."*
  - `MentorConsultations.tsx`: Updated `MESSAGEABLE_STATUSES` to `["ACCEPTED", "IN_PROGRESS"]`, disabled Milestone addition input, and disabled Note editing when request is `PENDING`. Added notice banner: *"👉 Accept this consultation request to start messaging with the team."*

### 2. Spring Boot / Hibernate `LazyInitializationException` Audit & Fixes
- **Root Cause**: Reading lazy-loaded proxy fields (e.g. `roundJudge.getJudge().getFullName()`, `categoryMentor.getMentor().getUserId()`, `event.getCreatedBy()`, `cm.getCategory().getEvent()`) outside an active Hibernate session caused `500 INTERNAL_SERVER_ERROR - Could not initialize proxy - no session`.
- **Fixed Service Implementations**:
  - `RoundServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getById`, `getByCategory`, `getFinalRound`, `getAdvancementTopN`, and `@Transactional` to `create`, `update`, `delete`.
  - `RoundJudgeServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getJudgesByRound`, `getRoundsByJudge`, `getAllJudges`.
  - `CategoryMentorServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getMentorsByCategory`, `getCategoryMentors`, `getAllMentors`.
  - `CategoryServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getByEvent`, `getById`, and `@Transactional` to `create`, `update`, `delete`.
  - `EventServiceImplementation.java`: Added `@Transactional(readOnly = true)` to `getById`, `getPublicEventById`, `getAllEventsForOrganizer`, and `@Transactional` to `create`, `update`, `updateStatus`, `delete`.
  - `EventCriterionServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getCriteriaByEvent`, and `@Transactional` to `importCriteriaToEvent`, `update`, `delete`.
  - `CriterionTemplateServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getAllActiveCriterionTemplates`, `getById`, and `@Transactional` to `create`.
  - `MentorDashboardServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getDashboardSummary`.
  - `PublicSummaryServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getLandingSummary`.
  - `ConsultationServiceImpl.java`: Added `@Transactional(readOnly = true)` to `getMentorRequests`, `getMentorsOfCategory`, `getAssignedCategoriesForMentor`, `getTeamsForMentorCategory`, `getMyMentors`, `getMyTeamMentorNotes`, `getMyTeamRequests`, `getConsultationRequestDetail`, `getConsultationMessages`.

### 3. Frontend String Interpolation Safety & `400 BAD_REQUEST` Prevention
- **Root Cause**: Passing undefined variables into URL template literals (e.g. `/api/v1/admin/submissions/${sub.submissionId}/approve`) resulted in `/api/v1/admin/submissions/undefined/approve`, failing Spring Boot UUID path parameter parsing.
- **Fixes**:
  - `AdminJudgingApprovalView.tsx`: Extracted `const subId = sub.submissionId || sub.id` for all table action buttons and added guard checks `if (!subId || subId === "undefined") return;`.
  - `EventJudgingApprovalTab.tsx`: Extracted `const subId = row.submissionId || row.id` for all action buttons and batch score lookups. Added guard check in `rejectScore`, `toggleApproval`, and `viewScores`.
  - `judgingService.ts`: Added defensive validation guards in `getBySubmission`, `getPublishedBySubmission`, and `deleteScores`.

### 4. Frontend Error Message Parsing (Fetch API vs Axios)
- **Root Cause**: Frontend error handling used `e?.response?.data?.message` (Axios pattern). Since `apiClient` uses standard `fetch` throwing `ApiError` with `.message` directly on the error object, `e?.response` evaluated to `undefined`, falling back to generic error messages instead of displaying backend error details (e.g. *"Only approved teams can create consultation requests"*).
- **Fix**: Updated `MyMentor.tsx` and `AdminAppealsView.tsx` to use `e?.message || e?.response?.data?.message || "Default message"`.

### 5. Table Empty State & Confirm Reject API Request Issue
- **Root Cause**: `EventJudgingApprovalTab.tsx` passed a mock object `[{ team: "No submissions ready for approval", status: "draft" }]` to `DataTable` when `submissions.length === 0`. Because this mock object lacked `submissionId` or `id`, `subId` was `undefined`. Condition `rejectingId === subId` evaluated `undefined === undefined` to `true`, rendering the Rejection input box on an empty/fake row. Clicking "Confirm Reject" called `rejectScore(undefined)`, which checked `if (!submissionId) return;` and returned silently without sending an API request.
- **Fix**: Removed mock object, added dedicated empty state `<Card className="p-8 text-center text-gray-500">No submissions ready for approval in this round.</Card>`, and added `if (!subId) return null;` in `ACTIONS` renderer.

### 6. Mentor Dashboard Team Status Badge & Final System Update
- **Mentor Dashboard Team Status Badge Fix (FE):** Cập nhật `MentorDashboard.tsx` thay thế badge trạng thái hardcode `status="active"` thành trạng thái động `status={(team.teamStatusName || team.teamStatusId || "active") as any}` ở danh sách đội thi bên trái, giúp hiển thị đúng các trạng thái như `Withdrawn` hoặc `Inactive`.
- **[SYSTEM]:** 
  - FE commits: `5f974027`, `a1544468`, `f50a9c9e`, `0780faab`, `a6d8875d` — Branch `mentor_AI`.
  - BE commits: `4d93373`, `0495cac`, `fad6451` — Branch `mentor_AI`.
