# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` – Start Vite dev server with React and React Compiler (babel-plugin-react-compiler)
- `pnpm pure-build` – Build only without type checking (Vite build)
- `pnpm build` – Run type checking followed by build (parallel execution)
- `pnpm build-only` – Alias for `pure-build`
- `pnpm type-check` – TypeScript type checking without emitting files
- `pnpm lint` – ESLint with auto‑fix across the whole project
- `pnpm format` – Format source files in `src/` with Prettier
- `pnpm openapi2ts` – Generate TypeScript types and API clients from the OpenAPI spec (schema at `http://localhost:8123/api/v3/api-docs`)
- `pnpm preview` – Preview the built application

**Note:** The `build` script uses `run-p` (from npm‑run‑all) to execute type checking and the build in parallel. Ensure `npm-run-all` is available (it may be installed globally) or install it as a dev dependency if the script fails.

## Project Overview

This is an **AI‑powered page generation platform** that lets users describe an application in natural language and generates deployable web projects. The frontend is a React single‑page application built with Vite and TypeScript.

### Key Technologies

- **Frontend:** React 19, React Router DOM, Zustand (state management), Ant Design (UI library) with Chinese locale (zh_CN), Axios (HTTP client)
- **Markdown Rendering:** markdown-it with highlight.js for syntax highlighting in chat interfaces
- **Utilities:** clsx (conditional classes), dayjs (date/time handling)
- **Build Tool:** Vite 8 (beta) with React plugin and React Compiler enabled – note that this is a beta version; check Vite release notes for potential breaking changes.
- **Language:** TypeScript with strict settings and path alias `@/*` → `./src/*`
- **Code Quality:** ESLint (TypeScript‑aware), Prettier (semi‑false, single‑quote, print‑width 100)
- **Backend Integration:** OpenAPI‑generated TypeScript types and API clients (via `@umijs/openapi`)
- **Package Manager:** pnpm (required; version 10.14.0+)

### Architecture Highlights

#### API Layer
- All backend types are generated into `src/api/typings.d.ts` (namespace `API.*`)
- API client functions are generated into `src/api/*Controller.ts` by the `openapi2ts` command
  - Available controllers: `appController`, `chatHistoryController`, `healthController`, `staticResourceController`, `userController`
- Request instance (`src/request.ts`) configures Axios with:
  - Base URL from `VITE_API_BASE_URL` (default `http://localhost:8123/api`)
  - Global request/response interceptors for error handling and login‑state detection
  - Credentials sent with every request (`withCredentials: true`)
- Backend responses follow the `BaseResponse<T>` pattern (`{ code: number, data: T, message: string }`); a `code` of `0` indicates success.

#### State Management
- **Login state:** `src/stores/loginUser.ts` – Zustand store that fetches and caches the current user
- **Permission hook:** `src/access.tsx` – `useAccess()` validates admin routes and redirects to login

#### Routing & Layout
- Router defined in `src/router/index.tsx` with the following active routes:
  - `/` – HomePage
  - `/user/login` – UserLoginPage
  - `/user/register` – UserRegisterPage
  - `/admin/userManage` – UserManagePage
  - `/app/chat/:id` – AppChatPage (AI chat interface for app generation)
- Additional routes (commented out): `/admin/appManage`, `/admin/chatManage`, `/app/edit/:id`
- `src/layouts/BasicLayout.tsx` provides a common frame with `GlobalHeader` and `GlobalFooter`
- Route‑level permission checks are performed by the layout via `useAccess()`

#### Visual Editor
- `src/utils/visualEditor.ts` – class that injects interactive editing scripts into iframes, enabling element selection and inspection for generated applications
- Used for “edit mode” where users can click elements in a preview to refine the generated output

#### Code Generation Types
- `src/utils/codeGenTypes.ts` – defines `CodeGenTypeEnum` (HTML, multi‑file, Vue project) and related configuration
- Used to differentiate the kind of project the AI will generate

#### Environment Configuration
- `src/config/env.ts` – centralizes environment variables:
  - `VITE_DEPLOY_DOMAIN` – base URL where deployed apps are hosted
  - `VITE_API_BASE_URL` – backend API base (default `http://localhost:8123/api`)
  - `STATIC_BASE_URL` – derived static‑resource URL
  - Helper functions `getDeployUrl()` and `getStaticPreviewUrl()`

#### App Generation Workflow
- The platform uses a chat-based interface (`AppChatPage`) where users describe applications in natural language
- AI responses are rendered with markdown-it and syntax-highlighted with highlight.js
- Generated applications can be edited via `AppEditPage` with visual editor support
- Static resources and deployments are managed through `staticResourceController`

### File Organization

```
src/
├── api/                    # Generated API clients and types
├── assets/                # Images (logo, hero, avatars)
├── components/            # Reusable UI (AppCard, GlobalHeader, GlobalFooter)
├── config/                # Environment & configuration
├── layouts/               # Page layout (BasicLayout)
├── pages/                 # Route‑level pages (HomePage, UserLoginPage, AppChatPage, AppEditPage, AppManagePage, UserManagePage)
├── stores/                # Zustand stores (loginUser)
├── utils/                 # Utilities (visualEditor, codeGenTypes, time)
├── access.tsx             # Permission hooks
├── App.tsx                # Root component (ConfigProvider + Router)
├── main.tsx               # Entry point
├── request.ts             # Axios instance with interceptors
└── router/                # React Router configuration
```

### Important Conventions

1. **TypeScript:** All new code must be typed. Use the generated `API.*` types for backend data structures.
2. **API Calls:** Always use the generated controller functions (e.g., `addApp`, `listMyAppVoByPage`) from `src/api/`. Never write raw Axios calls.
3. **State:** Global state belongs in Zustand stores; local UI state uses `useState`.
4. **Styling:** Ant Design components are the primary UI building blocks. Custom styles are placed in `.module.css` files co‑located with components.
5. **Environment Variables:** Prefix with `VITE_` to be exposed to the frontend. Access via `import.meta.env`.
6. **OpenAPI Updates:** After backend API changes, run `pnpm openapi2ts` to regenerate types and clients.
7. **Markdown Rendering:** For AI-generated content or chat interfaces, use `markdown-it` with `highlight.js` for syntax-highlighted code blocks.

### Running Tests

No test suite is currently configured. The project relies on manual verification and type‑safety.

### Deployment

The `build` command outputs to the `dist/` directory. The production environment expects `VITE_API_BASE_URL=/api` (relative) and `VITE_DEPLOY_DOMAIN=/dist` (relative). Adjust these variables according to your hosting setup.