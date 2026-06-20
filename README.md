# SEAL Hackathon FE

Frontend React/Vite cho SEAL Hackathon.

## Chay du an

```bash
npm i
npm run dev
```

FE mac dinh goi BE tai:

```ts
const BASE_URL = "http://localhost:8080";
```

File cau hinh hien tai: `src/app/services/apiClient.ts`.

## Backend

Backend dang nam tai:

```text
D:\1. FPT Document\Sem5\SWP391\BE\SEAL-Hackathon-BE
```

BE la Spring Boot, port mac dinh:

```text
http://localhost:8080
```

Tai lieu Swagger/OpenAPI cua BE:

```text
http://localhost:8080/swagger-ui.html
http://localhost:8080/v3/api-docs
```

## Xac thuc

Public endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /auth/verify-email`
- `/api/v1/public/**`
- Swagger/OpenAPI endpoints

Nhung endpoint con lai can header:

```http
Authorization: Bearer <accessToken>
```

FE dang luu token bang:

- `seal_access_token`
- `seal_refresh_token`
- `seal_user`

## Mapping service FE

Nen dung cac service moi trong `src/app/services`:

| FE service | Backend module |
| --- | --- |
| `authService.ts` | Auth |
| `eventService.ts` | Events |
| `categoryService.ts` | Categories, category mentors |
| `roundService.ts` | Rounds, round criteria, round judges, criteria templates |
| `teamService.ts` | Teams, join requests, eligibility, disqualification |
| `submissionService.ts` | Submissions, student downloads |
| `judgingService.ts` | Judging, audit logs |
| `rankingService.ts` | Rankings, public leaderboard |
| `awardService.ts` | Awards, award patterns, certificates |
| `notificationService.ts` | Notifications |

Luu y: `src/app/services/hackathonApi.ts` la service cu, nhieu path khong khop BE hien tai vi dang dat `BASE_URL = "http://localhost:8080/api/v1"` nhung van goi cac path nhu `/auth/login`. Khi tich hop that nen uu tien cac service rieng le o bang tren.

## API mapping tu BE

### Auth

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/auth/register` | `RegisterRequest` |
| `POST` | `/auth/login` | `LoginRequest` |
| `POST` | `/auth/logout` | `LogoutRequest` |
| `POST` | `/auth/refresh` | `RefreshTokenRequest` |
| `GET` | `/auth/verify-email?token={token}` | query `token` |

### Events

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/events` | - |
| `GET` | `/api/v1/event/{id}` | - |
| `POST` | `/api/v1/event` | `CreateEventRequest` |
| `PUT` | `/api/v1/event/{id}` | `UpdateEventRequest` |
| `PATCH` | `/api/v1/event/status/{id}` | `UpdateEventStatusRequest` |
| `DELETE` | `/api/v1/event/{id}` | - |

### Categories

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/categories/category/{eventId}` | `CreateCategoryRequest` |
| `GET` | `/api/v1/categories/categories/{eventId}` | - |
| `GET` | `/api/v1/categories/category/{id}` | - |
| `PUT` | `/api/v1/categories/category/{id}` | `UpdateCategoryRequest` |
| `DELETE` | `/api/v1/categories/category/{id}` | - |
| `POST` | `/api/v1/category/mentor/{categoryId}` | `AssignMentorsRequest` |

### Criteria

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/criteria/templates` | - |
| `GET` | `/api/v1/criteria/templates/{id}` | - |
| `POST` | `/api/v1/event/criteria/import/{eventId}` | `ImportCriteriaToEventRequest` |

### Rounds

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/round/{categoryId}` | `CreateRoundRequest` |
| `GET` | `/api/v1/round/{id}` | - |
| `GET` | `/api/v1/rounds/{categoryId}` | - |
| `PUT` | `/api/v1/round/{id}` | `UpdateRoundRequest` |
| `DELETE` | `/api/v1/round/{id}` | - |
| `GET` | `/api/v1/round/final/{categoryId}` | - |

### Round criteria

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/rounds/criterion/{id}` | - |
| `GET` | `/api/v1/rounds/criteria/{roundId}` | - |
| `POST` | `/api/v1/rounds/criteria/import/{roundId}` | `ImportCriteriaFromEventRequest` |
| `POST` | `/api/v1/rounds/criterion/{roundId}` | `CreateSpecificCriterionRequest` |
| `PUT` | `/api/v1/rounds/criterion/import/{id}` | `UpdateImportedCriterionRequest` |
| `PUT` | `/api/v1/rounds/criterion/{id}` | `UpdateSpecificCriterionRequest` |
| `DELETE` | `/api/v1/rounds/criterion/{id}` | - |

### Round judges

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/round/judges/{roundId}` | `AssignJudgesRequest` |
| `GET` | `/api/v1/round/judges/{roundId}` | - |
| `GET` | `/api/v1/judge/rounds/{judgeId}` | - |
| `DELETE` | `/api/v1/round/judge/{id}` | - |

### Teams

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/teams` | `CreateTeamRequest` |
| `GET` | `/api/v1/teams/{teamId}` | - |
| `GET` | `/api/v1/events/{eventId}/teams` | - |
| `GET` | `/api/v1/admin/events/{eventId}/teams/eligibility-review` | - |
| `POST` | `/api/v1/admin/teams/{teamId}/eligibility-decision` | `EligibilityDecisionRequest` |
| `GET` | `/api/v1/teams/{teamId}/members/{userId}` | - |
| `POST` | `/api/v1/teams/{teamId}/join` | - |
| `GET` | `/api/v1/teams/{teamId}/requests` | - |
| `PUT` | `/api/v1/teams/requests/{requestId}` | `HandleJoinRequest` |
| `DELETE` | `/api/v1/teams/{teamId}/members/{userId}` | - |
| `POST` | `/api/v1/admin/teams/{teamId}/disqualify` | `DisqualifyTeamRequest` |

### Submissions

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/submissions` | `CreateSubmissionRequest` |
| `GET` | `/api/v1/teams/{teamId}/rounds/{roundId}/submission` | - |
| `GET` | `/api/v1/admin/rounds/{roundId}/submissions` | - |
| `GET` | `/api/v1/admin/events/{eventId}/submissions` | - |
| `POST` | `/api/v1/admin/submissions/{submissionId}/disqualify` | `DisqualifySubmissionRequest` |

### Student downloads

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/student-downloads/rounds/{roundId}/problem?type=csv` | query `type`, default `csv` |
| `GET` | `/api/v1/student-downloads/rounds/{roundId}/problem-csv` | returns `text/csv` |
| `GET` | `/api/v1/student-downloads/rounds/{roundId}/problem-zip` | returns `application/zip` |

### Judging

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/judging` | `List<ScoreSubmissionDTO>` |
| `PATCH` | `/api/v1/judging` | `List<UpdateScoreSubmissionDTO>` |
| `GET` | `/api/v1/judging/submission/{submissionId}` | - |
| `GET` | `/api/v1/judging/judge/{judgeUserId}` | - |
| `GET` | `/api/v1/judging/audit-logs/event/{eventId}` | - |

### Rankings

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/admin/events/{id}/compute-rankings` | - |
| `POST` | `/api/v1/admin/rounds/{roundId}/compute-rankings?categoryId={categoryId}` | query `categoryId` |
| `GET` | `/api/v1/public/leaderboard/{eventId}/{categoryId}` | public |

### Awards

| Method | Path | Body/Query |
| --- | --- | --- |
| `POST` | `/api/v1/awards/grandAwardToATeam` | `AwardRequest` |
| `GET` | `/api/v1/awards/{id}` | - |
| `GET` | `/api/v1/awards/events/{eventId}` | - |
| `POST` | `/api/v1/awards/templates/categories/{categoryId}/award-patterns` | `AwardPatternRequest` |
| `GET` | `/api/v1/awards/categories/{categoryId}/award-patterns` | - |
| `GET` | `/api/v1/awards/categories/{categoryId}/rankings/top?roundId={roundId}&limit={limit}` | optional `roundId`, default `limit=10` |
| `POST` | `/api/v1/awards/categories/{categoryId}/auto-grant-top?roundId={roundId}&limit={limit}` | optional `roundId`, default `limit=10` |
| `GET` | `/api/v1/public/hall-of-fame` | public |

### Certificates

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/certificates/download/{awardId}` | returns PDF |

### Notifications

| Method | Path | Body/Query |
| --- | --- | --- |
| `GET` | `/api/v1/notifications/getMyNotifications?page={page}&size={size}` | default `page=0`, `size=20` |
| `GET` | `/api/v1/notifications/unread-count` | - |
| `GET` | `/api/v1/notifications/stream` | SSE stream |
| `POST` | `/api/v1/notifications/sendNotificationToUser` | `CreateNotificationRequest` |
| `POST` | `/api/v1/notifications/sendBroadcastNotification` | `BroadcastNotificationRequest` |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | - |
| `PATCH` | `/api/v1/notifications/read-all` | - |
| `DELETE` | `/api/v1/notifications/deleteNotification/{notificationId}` | - |

## Ghi chu tich hop

- ID tren BE la `UUID`, FE nen khai bao `string`.
- Body schema chi tiet nen doi chieu bang Swagger vi DTO co validation annotation.
- Download PDF/CSV/ZIP khong tra JSON, nen dung `fetch` truc tiep hoac tao URL download thay vi `api.get`.
- SSE `EventSource` khong gui duoc custom `Authorization` header. BE endpoint `/api/v1/notifications/stream` hien nhan auth tu Spring Security, nen cach `?token=...` trong FE chi dung neu BE co filter ho tro token qua query string.
