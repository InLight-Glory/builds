# STANDARDS.md

## 1. General Development Philosophy 🧠
*All projects, regardless of platform, follow these core tenets.*

* **Paradigm:** **Functional-Based Modular Programming**.
    * Code must be broken into self-contained, reusable modules.
    * Logic flows from high-level orchestrators to granular, pure functions.
* **Documentation:** Every logic block, function, or non-trivial rule must include a comment explaining the **WHY** (reasoning/intent), not just the **WHAT**.
* **The Iceberg Model:** Every project and its sub-components must maintain an Iceberg documentation structure (5 layers deep minimum) to ensure consistent pathing and easy pivoting between AI providers.

### 1.1 Architectural Model — VEC (View / Engine / Connector)

All projects follow a strict separation of concerns built around three system layers:

> The **View** defines how things look.
> The **Engine** defines how things work.
> The **Connector** defines how they talk.

```
View (UI Layer)
  ↓
Connector (Communication Layer)
  ↓
Engine (Logic Layer)
  ↓
Data Source (Persistence Layer)
```

Each layer has a strict responsibility and must not leak into others.

#### View 👁️

A View is the complete visual representation layer.

* **Controls:** layout (grid, flex, scaffolding), structure (sections, regions, containers), styling (themes, variants), responsiveness.
* **Does NOT:** contain business logic, fetch or mutate data directly.
* **Principle:** Views are interchangeable — they can be swapped to change layout, theme, or structure. Multiple Views can use the same Engines.

#### Engine ⚙️

An Engine is a pure logic module responsible for processing and transforming data.

* **Handles:** business logic, validation, data transformation, workflow orchestration, API coordination.
* **Does NOT:** render UI, depend on any View.
* **Single-Responsibility Rule:** Each Engine must do exactly **one** of: fetch data, transform data, or orchestrate a workflow. If an Engine does more than one, it must be split.
* **Principle:** Engines must be reusable and UI-agnostic.

#### Connector 🔌

A Connector is the communication layer between Views and Engines.

* **Responsible for:** invoking Engines from user interactions, passing inputs from Views to Engines, returning outputs back to Views.
* **Rules:** Views cannot call Engines directly. Engines cannot reference Views. All communication flows through Connectors.

### 1.2 Data Flow Direction

Standard flow for all operations:

```
View → Connector → Engine → Data Source
```

* **No reverse coupling** — a lower layer must never import or reference a higher layer.
* **No hidden data access** — all reads/writes must be traceable through this chain.
* **All flows must be traceable** — if you can't follow a user action through View → Connector → Engine → Data Source, the architecture is broken.

### 1.3 Boundary Enforcement ⚠️

If VEC boundaries are not enforced, the system degrades into tightly coupled, untestable, non-reusable code that AI will misinterpret.

**Common failure patterns to watch for:**
* Views containing logic ("quick fixes" that embed business rules in UI)
* Engines referencing UI state (pulling from widget context or view models)
* Connectors becoming logic-heavy (doing transformation instead of just routing)

**The test:** If a View can be deleted and replaced without touching any Engine, the architecture is correct. If removing a View breaks logic, a boundary has been violated.

### 1.4 Failure Handling & Fallbacks

All systems must define:
* **Primary path** — the expected happy-path data source or service.
* **Fallback path** — the degraded-but-functional alternative (e.g., DB → JSON fallback, API → cached response).
* **Failure trigger** — the condition that activates the fallback.

**Rule:** A system is incomplete until its failure mode is defined. This applies at every layer: Views must handle loading/error states, Engines must handle upstream failures, Data Sources must have fallbacks per §2 Data Resiliency.

---

## 2. Web Development Core Principles 🌐
*Specific requirements for web-based projects.*

* **Responsive First:** **Tablet-first design** is the baseline for all layouts. **Mobile design** is paramount.
* **Layout Engine (The Region-Content Theory):**
    * **Macro-Layouts (Regions):** **ALWAYS** use `grid-templates`. This defines the "Regions" of the application, allowing for clean structural understanding and easy re-positioning of large blocks.
    * **Component-Level (Sections):** **ALWAYS** use `flexbox` within those grid regions. This ensures internal elements and sections remain proportional and fluid.
    * **Adaptability:** Use `@media` queries specifically to shift the `grid-template` regions to accommodate different view sizes.
* **Stack Defaults:**
    * **Backend:** PHP (Primary)
    * **Frontend:** Vanilla JS / CSS
    * *Note: Frameworks or alternative languages require explicit dev approval.*
* **Data Resiliency:**
    * **Dev Mode:** Default to `.json` file-based storage for rapid prototyping.
    * **Production:** Optional config for SQL/NoSQL connections.
    * **Failover Logic:** Systems **must** include a fallback to `.json` flat-files if the primary DB connection fails.

---

## 3. The Iceberg Documentation Standard 🏔️
*Used for project mapping, roadmaps, and cross-AI consistency.*

The iceberg.md is a **living registry** — not documentation for humans, but a **navigation map for AI**. Its purpose is to eliminate the need for AI to search through thousands of lines of code to understand the app. Each layer zooms deeper into the same structure. An AI should be able to read iceberg.md once and know exactly where to go to make any fix or change.

### 3.1 Layer Definitions

| Layer | Name | What It Answers |
| :--- | :--- | :--- |
| **L1** | **Pages** | What screens/pages exist in the app? Where are they? How is the project structured? |
| **L2** | **Sections & Sub-Pages** | What's inside each page? Which components are embedded? What sub-pages exist? |
| **L3** | **Buttons & Functions** | What can users DO on each page? What buttons exist? What functions/actions do they trigger? |
| **L4** | **Data & Workflows** | What data powers each page? Which schema/collections are read/written? What are the end-to-end workflows? |
| **L5** | **The Deep** | Edge cases, security rules, performance optimizations, build configs, defensive logic, byte-level specs. |

### 3.2 L1 — Pages (Parent Level)

**This layer is the map.** An AI reads L1 and knows every screen in the app, where it lives on disk, and how the project is organized.

L1 must include:

*   **Project summary** — one paragraph: what the app is, who it's for, the core metaphor or concept.
*   **Tech stack** — frontend, backend, payments, platforms. One line each.
*   **Project root directory tree** — a `tree`-style view of the top-level folder structure with inline annotations (`← purpose`). Every folder that appears deeper in L2–L5 must be visible here.
*   **Top-level page table** — every navigable page in the app listed with:
    *   **Page name** — human-readable label
    *   **File path** — relative path from `lib/` (or project source root)
    *   **Purpose** — one-line description of what this screen is for
*   **Organizational conventions** — explain any prefix systems, naming patterns, or folder hierarchies (e.g., `a_` = Section A, `z_` = admin pages).

### 3.3 L2 — Sections & Sub-Pages (What's Inside Each Page)

**This layer zooms into each page.** An AI reads L2 and knows what's ON each screen — the components embedded in it, the sections/regions of the UI, and any sub-pages it navigates to.

L2 must include for **each page**:

*   **Components used** — which reusable components are embedded in this page (list by name, with paths).
*   **Also uses** — any backend services, custom actions, custom widgets, or utilities this page imports beyond its components.
*   **Sub-pages / child navigation** — which other pages this page navigates to (the "navigates to" list).
*   **Page parameters** — what parameters this page accepts (from the route definition).

L2 must also include:

*   **Component file-path table** — every reusable component listed with path and purpose, organized by tier/folder.
*   **Component reuse map (blast radius)** — a table showing which pages use each shared component. An AI changing a component checks this to know what else will break.
*   **Navigation flows** — explicit page-to-page sequences for each major user journey (e.g., `splash → sign_in → onboarding_1 → onboarding_2 → dashboard`).
*   **Route registry** — complete routing table with route names, URL paths, auth requirements, and parameters. Sourced from the router definition file.

### 3.4 L3 — Buttons & Functions (What Users Can DO)

**This layer maps interaction to code.** An AI reads L3 and knows which buttons, taps, and gestures exist on each page, and which functions or actions they trigger.

L3 must include:

*   **Key interactions per page** — for each page (or at minimum, each primary page), list the significant user actions:
    *   **Action** — what the user does (e.g., "Tap Deposit button", "Swipe to delete", "Pull to refresh")
    *   **Triggers** — what function, custom action, or API call runs when this action happens
    *   **Result** — what the user sees after (navigation, toast, modal, data change)
*   **Custom actions table** — every handwritten action with file path, purpose, and which pages invoke it.
*   **Custom widgets table** — every handwritten widget with file path, purpose, and where it's rendered.
*   **Subscription gating** — which features/actions are gated behind Free / Plus / Premium tiers.

### 3.5 L4 — Data & Workflows (What Powers Each Page)

**This layer maps data to pages.** An AI reads L4 and knows which database collections each page reads/writes, how data flows between pages, and what the end-to-end workflows look like.

L4 must include:

*   **Schema table** — every database collection/table with:
    *   **Record file** — path to the schema definition
    *   **Collection/table name** — the actual database identifier
    *   **Purpose** — one-line description
*   **Page-to-schema map** — for each page, which collections it reads and which it writes. Format: `page_name → reads: [collections] / writes: [collections]`.
*   **Data structures** — key structs, models, or custom types with their fields and types.
*   **End-to-end workflows** — for each major feature, trace the full flow from user action to database to result:
    *   Example: `User taps "Deposit" → selects passage → component_new_deposit validates → writes to all_deposits_record → point awarded via PointRecordStruct → dashboard count updates`
*   **Auth providers** — every authentication method with file path and purpose.
*   **Push notification pipeline** — trigger → handler → serialization → deep link (if applicable).
*   **"The Why" notes** — for any non-obvious architectural decision, include a brief "Why?" note inline. These explain reasoning without consuming a dedicated layer (e.g., *Why `userz` not `users`? — avoids Firebase reserved path collision*).

### 3.6 L5 — The Deep

**This layer is the fine print.** An AI reads L5 when debugging edge cases, investigating security, or configuring builds.

L5 must include:

*   **Security rules** — Firestore/database access control logic, storage rules, role-based access.
*   **Cloud Functions / server-side logic** — entry points, triggers, what they do.
*   **Edge cases & defensive logic** — known edge cases and how they're handled (e.g., transfer-to-self blocked, offline resilience, concurrent request handling).
*   **Performance optimizations** — keep-alive wrappers, request deduplication, animation controllers, lazy loading.
*   **Build & release** — platform-specific build configs, signing, environment variables, feature flags, CI/CD.
*   **Backend services** — API call definitions, purchase service, storage helpers.

### 3.7 Inline "Why" Rule

Every layer can include **"Why?"** notes for non-obvious decisions. These are short, inline explanations — not a separate layer. Format: `*Why [decision]? — [reason].*` This prevents a future AI from "fixing" something that was intentional.

### 3.8 Maintenance Rule

The iceberg.md must be updated whenever:
*   A page, component, schema collection, or navigation flow is added, removed, or restructured.
*   A component's usage (which pages consume it) changes.
*   A route is added or modified.
*   A custom action or widget is added.

If the iceberg.md is stale, AI will make wrong assumptions. Treat it as a living document. See also `dev_checker.md` for the full post-change review checklist.

### 3.9 Development Lifecycle Gate

All features must follow this sequence before implementation begins:

1. **Idea** — logged in `dev_ideas.md`
2. **Iceberg Definition** — L1–L3 minimum (where it lives, what's inside it, what users can do)
3. **Engine Design** — L4 (data flow, schema, workflows)
4. **Implementation**
5. **Validation** — testing against expected behavior
6. **Deployment**
7. **Monitoring** — confirm observability is in place

**Gate rule:** No coding before L3 is defined. No deployment without validation. Every feature must map into the Iceberg before the first line of code is written. This prevents "design-as-you-code" drift and ensures AI agents have the registry entry before they touch the codebase.

---

## 4. Refactoring & Analysis Protocol 🔄
*Protocol for when we aren't starting from scratch or are pivoting direction.*

* **Refactor Analysis Iceberg:** Before refactoring, an analysis `.md` of the current codebase must be created.
* **Snapshot Intent:** This serves as a snapshot of plans, thoughts, and reasoning so the project can be reverted if the refactor misses the mark.
* **Consistency Path:** These perspectives ensure the "Expected Desires" and roadmap remain consistent even when switching between different AI code providers.
* **Modular Impact:** Identify which functional modules are affected and map the changes through their child components.

---

## 5. Getting Started Documentation Standard 🚀
*All projects must include a `Getting_started.md` file designed for first-time users.*

*   **How-to Section:** Clear, step-by-step instructions on how to use the project's core features.
*   **Installation Section (If needed):** Prerequisites, setup instructions, and how to run or deploy the project.
*   **Additional Information:** Any other context, troubleshooting tips, or environment requirements that ensure a smooth onboarding experience for new users.

---

## 6. Dev Ideas Documentation Standard 💡
*All projects must include a `dev_ideas.md` — a living document where developers and builders communicate about probable scope, feature proposals, and architectural explorations.*

The `dev_ideas.md` serves as a **shared brainstorming ledger** between developers and builders (product owners, designers, stakeholders). It captures ideas before they become formal roadmap items, preventing scope amnesia and ensuring good ideas don't get lost between conversations.

*   **Structure:** Each idea entry must include:
    *   **Title** — A short, descriptive name for the idea.
    *   **Proposed By** — Who surfaced the idea (dev name, builder name, or AI session).
    *   **Date Added** — When the idea was logged.
    *   **Scope Estimate** — A rough T-shirt size (XS / S / M / L / XL) to communicate effort at a glance.
    *   **Description** — A 2–4 sentence explanation of the idea, the problem it solves, and its potential impact.
    *   **Status** — One of: `💭 Idea` → `🔍 Under Review` → `✅ Approved` → `🚀 In Roadmap` → `❌ Rejected`.
*   **Conversation Thread (Optional):** Beneath each idea, devs and builders can append short threaded notes (name + date + comment) to discuss feasibility, trade-offs, or scope adjustments without needing a separate meeting.
*   **When To Use It:** Whenever a developer, builder, or AI agent identifies a feature opportunity, improvement, or architectural change that isn't yet on the roadmap. Log it here *before* adding it to any formal roadmap or task board.
*   **Why It Matters:** Projects stall when good ideas live in Slack threads, voice memos, or forgotten conversation logs. The `dev_ideas.md` creates a single, persistent place for scope conversations — bridging the gap between "someone mentioned this once" and "this is now a planned feature."

---

## 7. Issue Tracker Documentation Standard 🐛
*All projects must include an `issue_tracker.md` — a living document for cataloging important issues, bugs, and blockers discovered during development.*

The `issue_tracker.md` acts as a **lightweight, in-repo issue log** for devs and builders to communicate about problems found during development, testing, or AI-assisted coding sessions. It captures issues that need visibility before they become critical.

*   **Structure:** Each issue entry must include:
    *   **ID** — A sequential issue number (e.g., `GT-001`).
    *   **Title** — A concise description of the issue.
    *   **Reported By** — Who found the issue (dev name, tester, or AI session).
    *   **Date Found** — When the issue was discovered.
    *   **Severity** — One of: `🔴 Critical` | `🟠 High` | `🟡 Medium` | `🟢 Low`.
    *   **Affected Area** — Which component, file, or feature is impacted.
    *   **Description** — What's happening, steps to reproduce (if applicable), and expected vs. actual behavior.
    *   **Status** — One of: `🆕 New` → `🔍 Investigating` → `🔧 In Progress` → `✅ Resolved` → `🚫 Won't Fix`.
    *   **Resolution Notes (when resolved)** — What fixed it, which files changed, and any follow-up needed.
*   **Builder Notes Section:** Builders can append priority overrides, business context, or user-impact notes to any issue to help devs triage effectively.
*   **When To Use It:** Whenever a bug, regression, unexpected behavior, performance problem, or compatibility issue is discovered — whether by a human or an AI agent during a coding session. Log it immediately so it doesn't get lost.
*   **Why It Matters:** Issues found during development are often communicated verbally or buried in tool-specific trackers that builders can't easily access. The `issue_tracker.md` keeps the conversation in-repo, visible to all team members and AI providers, and directly linked to the codebase it describes.

---

## 8. Dev Checker Documentation Standard ✅
*All projects must include a `dev_checker.md` — a living checklist of documentation and registry files that may need updating after any code change.*

The `dev_checker.md` acts as a **post-change review gate**. After modifying the project, developers (or AI agents) should consult this file to determine which docs or registries are now potentially stale.

*   **What It Tracks:** A list of project files that are tightly coupled to the codebase structure and must stay in sync with it. Examples:
    *   `Getting_started.md` — Update if install steps, prerequisites, commands, or core how-to workflows change.
    *   `iceberg.md` — Update if a new page, function, workflow, or sub-component is added, removed, or restructured.
    *   `dev_ideas.md` — Update if a new idea surfaces, an existing idea changes status, or scope estimates are revised.
    *   `issue_tracker.md` — Update if a bug is found or resolved, a regression is introduced, or a known issue's severity changes.
    *   `dev_checker.md` itself — Update if the project's scaffolding changes (e.g., new config files, registries, or documentation files are introduced) so future changes are also caught.
    *   Any **registry or manifest file** (e.g., `views.json`, `pages.json`, routing configs) — Update if the entry it tracks is added, renamed, or removed.
*   **When To Use It:** After every meaningful change — new feature, refactor, dependency update, or structural reorganization — review the checklist before considering the work "done."
*   **Why It Matters:** A stale registry or outdated overview can silently break a project. The `dev_checker.md` prevents drift between the code and its documentation, ensuring the project remains understandable and functional across AI providers and team members.

---

## 9. Logging & Debugging Standard 🧾

Logging is distributed across system layers and must remain **minimal, structured, and failure-focused**.

All projects must include logging and tracing sufficient to diagnose issues without reading source code.

*   **Error context** must be preserved — catch blocks must log the originating layer, operation name, and input state. Never swallow errors silently.
*   **Rule:** If a bug cannot be traced quickly through logs, observability is insufficient. Add logging before adding more debugging code.

---

### Core Principle

Only log when something is:
- missing
- invalid
- unexpected
- unable to render

Do NOT log normal execution flow.

---

### Logging Responsibility by Layer

#### Engine ⚙️ (Medium Logging)
Engines log internal logic failures only.

Examples:
- missing required fields
- validation failures
- unexpected data conditions

Format:
`[Engine:<engine_name>] <issue>`

Example:
`[Engine:getUserStats] Missing field: totalPoints`

---

#### Connector 🔌 (Primary Debug Layer — Heavy Logging)
Connectors log all data contract violations and invalid outputs from Engines.

Responsibilities:
- validate Engine output
- detect invalid or incomplete data
- log failures before passing data to Views

Format:
`[Connector:<connector_name>] <issue>`

Example:
`[Connector:UserStats] Invalid data: missing totalPoints`

---

#### View 👁️ (Minimal Logging)
Views log only when they cannot render due to invalid or missing data.

Views must NOT perform deep validation logic.

Format:
`[View:<view_name>] Cannot render <component/section> - <reason>`

Example:
`[View:Dashboard] Cannot render stats - missing totalPoints`

---

### Logging Rules

- No logs for successful execution
- No logs for function calls or normal flow
- Every log must include:
  - layer (Engine / Connector / View)
  - module name
  - clear issue description

---

### Traceability Rule

Logs must allow a full trace across layers without reading code.

A failure should be traceable as:

`View → Connector → Engine`

Example:
```
[Engine:getUserStats] Missing field: totalPoints
[Connector:UserStats] Invalid data: missing totalPoints
[View:Dashboard] Cannot render stats - missing totalPoints
```

---

### Failure Responsibility

- **Engine** → responsible for logic correctness
- **Connector** → responsible for data validity
- **View** → responsible for safe rendering

If a View fails:
- the Connector passed invalid data

If a Connector logs an error:
- the Engine likely returned invalid data

---

### Goal

The system must make failures immediately visible and traceable with minimal logging noise.

---

## 10. Security Baseline 🔐
*Minimum security posture for all projects.*

*   **Validate all inputs** — every Engine that accepts external data must validate type, range, and format before processing.
*   **Sanitize all outputs** — data rendered in Views must be escaped/sanitized to prevent injection (XSS, SQL injection, etc.).
*   **No hardcoded secrets** — API keys, tokens, and credentials must live in environment variables, secure config files, or secret managers. Never in source code.
*   **Centralized authentication** — auth logic lives in one place (the auth layer), not scattered across Views or Engines. Per VEC: auth checks happen in Connectors before invoking gated Engines.

---

## 11. Testing Standard 🧪
*Minimum testing expectations for all projects.*

*   **Engines** — unit tests. Each Engine's single responsibility makes it independently testable. Test inputs → outputs without any View dependency.
*   **Connectors** — integration tests. Verify that Connectors correctly wire View inputs to Engine calls and return expected results.
*   **Views** — UI validation. Confirm rendering, responsiveness, and that Views correctly display Engine outputs routed through Connectors.
*   **Rule:** If a layer can't be tested in isolation, its boundaries are leaking. Fix the architecture before writing more tests.

---

## 12. Create Markdowns 📝
*When applying this standards file to a new project, use this section as the bootstrap checklist. Say **"create markdowns"** and the following files will be generated for the project.*

When a developer or AI agent receives the instruction **"create markdowns"**, they must generate or update the following files in the project root, tailored to the specific project's architecture and codebase:

| # | File | Purpose | Reference Standard |
| :--- | :--- | :--- | :--- |
| 1 | `iceberg.md` | 5-layer deep project map covering surface purpose through implementation specs. | §3 — Iceberg Standard |
| 2 | `dev_ideas.md` | Shared brainstorming ledger for devs and builders to log feature ideas and scope discussions. | §6 — Dev Ideas Standard |
| 3 | `issue_tracker.md` | In-repo issue log for cataloging bugs, blockers, and important issues found during development. | §7 — Issue Tracker Standard |
| 4 | `dev_checker.md` | Post-change review gate listing all docs and registries that must stay in sync with the codebase. | §8 — Dev Checker Standard |

### Generation Rules:
*   **Project-Aware:** Each file must be populated with real content based on the current project — not generic templates. Analyze the codebase, understand its structure, and write entries that reflect the actual state of the project.
*   **`iceberg.md`** — Analyze the project and fill all 5 layers (L1–L5) with accurate component mappings, logic flows, reasoning, and implementation details.
*   **`dev_ideas.md`** — Initialize with a header and empty structure ready for entries. If obvious feature opportunities exist (e.g., from a roadmap or TODO), seed 1–2 starter ideas.
*   **`issue_tracker.md`** — Initialize with a header, the project's issue prefix (e.g., `GT-001`), and empty structure ready for entries. If known issues exist (e.g., from an issues file or TODOs), seed them as initial entries.
*   **`dev_checker.md`** — Scan the project for all documentation files, config files, registries, and manifests. Build the checklist with specific "Update When" triggers for each file found.
*   **Order of Creation:** Generate in the order listed above — iceberg first (provides project understanding), then dev_ideas & issue_tracker (communication docs), then dev_checker last (needs to reference all other files).

### Versioning & Archive Protocol 🗂️
*Archiving only happens during a **"create markdowns"** call — not on regular day-to-day edits.*

Everyday changes to these files (adding an issue, logging an idea, updating a checklist row) are normal in-place edits — no archiving needed. The archive **only** kicks in when the **"create markdowns"** command is run, which regenerates the files from scratch based on the current state of the project. Before that regeneration, the previous version is preserved so it can be referenced later.

*   **Archive Folder:** Every project using this standard must have an `archive/` directory in the project root.
*   **What gets archived:** Only the four files created by "create markdowns":
    1. `iceberg.md`
    2. `dev_ideas.md`
    3. `issue_tracker.md`
    4. `dev_checker.md`
*   **On "create markdowns" — if one of these files already exists:** Move it into `archive/` before generating the new version.
    *   **Naming convention:** `{filename}_v{N}_{YYYY-MM-DD}.md`
    *   Example: `iceberg.md` → `archive/iceberg_v1_2026-03-30.md`
    *   The version number `N` is determined by counting existing archived versions of that file + 1.
*   **On "create markdowns" — if a managed file does NOT exist:** Generate it fresh in the project root. No archive entry is created (this is `v1`).
*   **The project root always holds the current version.** To see what's current, just open the file. To see the state before the last regeneration, browse `archive/`.
*   **Why it matters:** When "create markdowns" regenerates docs based on a changed codebase, the old version captures the previous state of the project — what the architecture looked like, what ideas were on the table, which issues were active. This decision trail prevents "scope amnesia" and gives builders a timeline to reference.