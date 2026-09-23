# iiDENTIFii Forum Assessment

[![CI](https://github.com/SeanJuice/iidentifii-forum-assessment/actions/workflows/ci.yml/badge.svg)](https://github.com/SeanJuice/iidentifii-forum-assessment/actions/workflows/ci.yml)

A full-stack forum proof of concept where integration users can browse discussions publicly and registered users can contribute posts, comments, and likes. Moderators can identify misleading or false information.

## Technology

| Area | Choice |
| --- | --- |
| Web | Angular 22, TypeScript, Tailwind CSS 4 |
| API | ASP.NET Core 8, C# |
| Authentication | ASP.NET Core Identity and JWT bearer tokens |
| Persistence | Entity Framework Core and SQLite |
| API documentation | OpenAPI and Swagger UI |
| Testing | xUnit API integration tests, Vitest component tests, and Playwright browser tests |
| Automation | GitHub Actions |

## Requirements covered

| Assessment requirement | Implementation |
| --- | --- |
| Public browsing | Post list and details allow anonymous access |
| Local authentication | Registration and login use Identity with locally issued JWTs |
| Authenticated contributions | Creating posts, comments, and likes requires authentication |
| Like rules | Unique database constraint, duplicate conflict response, and self-like prevention |
| Roles | User and Moderator roles are seeded and enforced by authorization policies |
| Moderation | Only moderators can add the fixed misleading information tag |
| Discovery | Server-side search; filter by date, author, or topic; sort by date or likes; paginate posts and comments |
| Third-party API | REST endpoints are versioned under `/api/v1` and documented with Swagger |
| Seed data | 8 users and 48 dated discussions with varied comments, likes, topics, and moderation tags |
| Delivery evidence | Incremental commits and GitHub Actions show development and validation history |

## Repository structure

```text
backend/
  Forum.Api/             ASP.NET Core API
  Forum.Api.Tests/       API integration tests
frontend/
  forum-web/             Angular application
docs/
  ARCHITECTURE.md        Design decisions and trade-offs
  DEMO.md                Suggested assessment walkthrough
postman/
  forum-api.postman_collection.json
  local.postman_environment.json
```

## Prerequisites

- .NET SDK 8
- Node.js 24.15 or newer in the supported Angular 22 range
- npm 11 or newer

## Run locally

### 1. Configure local secrets

The repository intentionally contains no signing key or demo password. Set both in your current terminal before starting the API.

PowerShell:

```powershell
$env:Jwt__Key = "choose-a-private-signing-key-of-at-least-32-characters"
$env:Seed__DemoPassword = "choose-a-strong-demo-password"
```

Bash:

```bash
export Jwt__Key="choose-a-private-signing-key-of-at-least-32-characters"
export Seed__DemoPassword="choose-a-strong-demo-password"
```

The password must satisfy the configured Identity policy: eight or more characters with uppercase, lowercase, number, and symbol characters.

### 2. Start the API

```bash
dotnet restore Iidentifii.Forum.sln
dotnet run --project backend/Forum.Api
```

The API runs at `http://localhost:5080`. Swagger UI is available at `http://localhost:5080/swagger`.

### 3. Start the Angular application

In a second terminal:

```bash
cd frontend/forum-web
npm ci
npm start
```

Open `http://localhost:4200`.

## Seeded accounts

All seeded accounts use the password supplied through `Seed__DemoPassword`.

| Role | Email |
| --- | --- |
| User | `user@demo.local` |
| User | `partner@demo.local` |
| Moderator | `moderator@demo.local` |
| User | `naledi@demo.local` |
| User | `ethan@demo.local` |
| User | `priya@demo.local` |
| User | `kabelo@demo.local` |
| User | `sarah@demo.local` |

## Run validation

```bash
dotnet test Iidentifii.Forum.sln -c Release
cd frontend/forum-web
npm test
npm run build
```

To run the real browser integration locally, keep the same API environment variables set, install Chromium once, and run:

```bash
cd frontend/forum-web
npx playwright install chromium
E2E_DEMO_PASSWORD="$Seed__DemoPassword" npm run test:e2e
```

GitHub Actions performs the API tests, Angular tests, production build, and browser integration test on every push and pull request to `main`.

## API summary

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Public | Register and receive a token |
| POST | `/api/v1/auth/login` | Public | Log in and receive a token |
| GET | `/api/v1/auth/me` | Authenticated | Return the current user |
| GET | `/api/v1/authors` | Public | List post authors for filter controls |
| GET | `/api/v1/posts` | Public | Searchable, filtered, sorted, paginated post list |
| GET | `/api/v1/posts/{id}` | Public | Post details and comment count |
| GET | `/api/v1/posts/{id}/comments` | Public | Filtered, sorted, paginated comments |
| POST | `/api/v1/posts` | Authenticated | Create a post |
| POST | `/api/v1/posts/{id}/comments` | Authenticated | Add a comment |
| POST | `/api/v1/posts/{id}/likes` | Authenticated | Like a post |
| DELETE | `/api/v1/posts/{id}/likes` | Authenticated | Remove a like |
| POST | `/api/v1/posts/{id}/moderation-tags` | Moderator | Add the misleading information tag |

The Postman collection includes runnable examples and automatically captures tokens and created post identifiers.

## Further information

- [Architecture and decisions](docs/ARCHITECTURE.md)
- [Demonstration guide](docs/DEMO.md)
- [Postman collection](postman/forum-api.postman_collection.json)
