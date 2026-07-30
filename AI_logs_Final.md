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

### 6. Mentor Dashboard Team Status Badge & AI Mentor Prompt Refinement
- **Mentor Dashboard Team Status Badge Fix (FE):** Cập nhật `MentorDashboard.tsx` thay thế badge trạng thái hardcode `status="active"` thành trạng thái động `status={(team.teamStatusName || team.teamStatusId || "active") as any}` ở danh sách đội thi bên trái, giúp hiển thị đúng các trạng thái như `Withdrawn` hoặc `Inactive`.
- **AI Mentor Chat Bubble Redesign (FE):** Thiết kế lại toàn bộ giao diện bong bóng tin nhắn của AI Mentor trên `TeamConsultations.tsx` và `MentorConsultations.tsx`. Chuyển tin nhắn AI Mentor sang tông màu Tím thạch anh (Purple Violet Gradient `linear-gradient(135deg, #f5f3ff, #ede9fe)`), viền viền tím đậm (`border: 1px solid #c084fc`, `borderLeft: 4px solid #8b5cf6`), chữ tím sẫm (`color: #3b0764`), đi kèm huy hiệu phát sáng `✨ AI Assistant`. Giúp phân biệt hoàn toàn 100% với tin nhắn của Team Leader (khung trắng sắc nét) và Mentor (khung màu chủ đạo).
- **[SYSTEM]:** 
  - FE commits: `5f974027`, `a1544468`, `f50a9c9e`, `0780faab`, `a6d8875d`, `ab03f1c5`, `8c43be43` — Branch `mentor_AI`.
  - BE commits: `4d93373`, `0495cac`, `fad6451`, `e0ad34a`, `4b51d35`, `b99dceb` — Branch `mentor_AI`.

---

## Session Summary - Certificate Redesign, Both Certificate Types, HikariCP & Spring Context Fixes

### 1. Certificate PDF UI Redesign & Watermark Adjustment
- **Requirement**: Update Certificate PDF UI to modern dark theme matching SEAL Hackathon web style (`#0f172a`, gold/orange borders `#fbbf24`, `#f97316`), and center a large faded background watermark logo (`logo_trans.png`).
- **Template Improvements (`certificate.html`)**:
  - A4 Landscape layout (`@page { size: A4 landscape; margin: 0; }`).
  - Centered watermark logo with soft opacity `0.035` (`top: 145px; left: 50%; width: 400px; margin-left: -200px;`) to prevent clashing with text elements.
  - Dynamically bound Thymeleaf variables `certMainTitle`, `certSubtitle`, and `citation`.
  - Fixed Thymeleaf SpEL expression evaluation for String fields (`logoBase64 != ''`, `categoryName != ''`, `awardTierName != ''`) eliminating `500 INTERNAL_SERVER_ERROR` during rendering.

### 2. Business Logic Support for Both Participation & Award Certificates
- **Requirement**: Allow ALL students who actively participated in an event to download a "Certificate of Participation". For students whose team won published awards, render a list of selectable certificates (Participation Certificate + Award Certificate(s)).
- **Backend Implementations**:
  - Created `CertificateItemResponse.java` DTO.
  - Updated `TeamMembersRepository.java` with `@Query` method `findActiveMemberInEvent` using `JOIN FETCH tm.team team LEFT JOIN FETCH team.event LEFT JOIN FETCH team.category`.
  - Implemented `getCertificatesForUserInEvent`, `generateParticipationCertificatePdf`, and Base64 logo loader in `CertificateServiceImpl.java`.
  - Added REST endpoints in `CertificateController.java`:
    - `GET /api/v1/certificates/events/{eventId}`: List available certificates for the current user in an event.
    - `GET /api/v1/certificates/download/participation/{eventId}`: Download Participation Certificate PDF.
    - `GET /api/v1/certificates/download/{awardId}`: Download Award Certificate PDF.
- **Frontend Integration**:
  - Updated `awardService.ts` with `getEventCertificates`, `downloadParticipationCertificate`, and `downloadAwardCertificate`.
  - Redesigned Certificates tab in `MemberDashboard.tsx` to list all available certificates (Participation & Award Tiers) with View & Download actions.

### 3. Database Connection Leak Prevention & HikariCP Optimization
- **HikariCP Leak Detection**: Added `spring.datasource.hikari.leak-detection-threshold=20000` (20s) to `application.properties` to log stack traces if connections are held > 20s.
- **Gemini API Network Call & Timeout Fix**:
  - Configured `SimpleClientHttpRequestFactory` with `connectTimeout(5000)` (5s) and `readTimeout(10000)` (10s) on `RestTemplate` in `GeminiServiceImpl.java`.
  - Refactored `sendMessage` in `ConsultationServiceImpl.java` to execute `geminiService.askAi(...)` **outside** the `@Transactional` boundary, preventing database connections from being held hostage during external network requests.
- **Notification Broadcast Fix**: Updated `notifyNonCompliantUsers` in `UserManagementService.java` to `@Transactional(readOnly = true)`, releasing the database connection immediately after scanning before broadcasting notifications.

### 4. Spring Application Context Initialization Fix
- **Root Cause**: `SystemSettingServiceImpl.java` used Lombok `@RequiredArgsConstructor` with `private final ObjectMapper objectMapper = new ObjectMapper();`. Lombok included `ObjectMapper` in the generated constructor parameter list, causing Spring to fail starting with `UnsatisfiedDependencyException` when an `ObjectMapper` bean was not found in the Application Context.
- **Fix**:
  - Added `@Bean @Primary public ObjectMapper objectMapper()` in `JacksonConfig.java` to register a managed `ObjectMapper` bean with custom modules (`uppercaseUuidModule`, `JavaTimeModule`).
  - Updated `SystemSettingServiceImpl.java` to `private final ObjectMapper objectMapper;` for Spring dependency injection.

### 5. Git Commit Logs
- **BE Commit**: `ac57b88` — `fix(certificate,hikari,config): fix participation certificate download, prevent DB connection leaks and add ObjectMapper bean` — Branch `mentor_AI`.
- **FE Commit**: `a95f27ce` — `feat(certificate): support participation and award certificates UI in member dashboard` — Branch `mentor_AI`.
