# Assessment demonstration guide

This walkthrough is designed for a short technical presentation.

## 1. Introduce the solution

- Explain the public knowledge-sharing goal.
- Show the Angular and ASP.NET Core monorepo structure.
- Point out the incremental commit history and passing CI workflow.

## 2. Demonstrate public access

- Open the home page without logging in.
- Browse the 48 seeded discussions and use next-page navigation.
- Search for `constant-time` to demonstrate full-dataset server search.
- Filter by topic, author, and date, then sort by likes.
- Open a discussion and page, filter, and sort its comments.
- Explain that public endpoints do not require a token.

## 3. Demonstrate a registered user

- Register a new account or log in as `user@demo.local`.
- Create a discussion with multiple topics.
- Add an answer to another discussion.
- Like another user's post and remove the like.
- Attempt to like the user's own post and explain the server-side rule.

## 4. Demonstrate moderation

- Log out and sign in as `moderator@demo.local`.
- Open an untagged discussion.
- Add the misleading information tag.
- Explain that both the UI and API respect the Moderator role, while the API is authoritative.

## 5. Demonstrate the API

- Open Swagger UI at `http://localhost:5080/swagger`.
- Show the `/api/v1` routes and schemas.
- Run the Postman login request and inspect the captured token.
- Run list, create, comment, like, and moderation requests.
- Run author discovery and paged comment requests.
- Explain server-side search, paging, filtering, sorting, validation, and problem-details responses.

## 6. Demonstrate quality controls

- Open the GitHub Actions workflow.
- Show the Angular production build and 5 Vitest checks.
- Show the 8 API integration tests.
- Show the Playwright browser job that exercises Angular and the API together.
- Highlight tests for authentication, self-likes, duplicate likes, search, comment paging, and moderator authorization.

## 7. Close with trade-offs

- SQLite and startup seeding keep local setup quick.
- EF Core allows migration to a managed relational database.
- Session storage is acceptable for the proof of concept; production should use secure cookies.
- Mention the production improvements documented in `ARCHITECTURE.md`.

## Suggested presentation structure

| Section | Approximate time |
| --- | ---: |
| Problem and architecture | 2 minutes |
| Public and user flows | 4 minutes |
| Moderation and API | 3 minutes |
| Tests, security, and trade-offs | 3 minutes |
