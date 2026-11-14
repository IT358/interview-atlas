Cursorで初めて開く方は、まず [README_CURSOR_JA.md](README_CURSOR_JA.md) を読んでください。

## Website-only projects and company research — 2026-11-12

The discover view now shows individually verified website projects rather than general search links or development job feeds. `data/researched-website-jobs.json` contains primary-page research metadata and short original summaries. `/api/website-jobs` accepts only supported numbered project detail URLs on CrowdWorks and Lancers, checks the source body and application deadline, rejects closed/expired/non-website/unknown listings, and caches source checks in R2. Seed verification ages out after24hours; force refresh re-reads the fixed known pages. Search results require either direct primary HTML or a full Tavily source body, never a search snippet alone. A live posting is not a guarantee of client identity, payment or eligibility.

Company research is a distinct view. `data/researched-companies.json` contains100 unique Japan-based production businesses (including individual studios) with official partner-page URLs, paraphrased evidence, requirements and research dates.7 have explicitly published subcontract compensation; client retail prices are separate. A shared work-scope estimate is always labeled a planning hypothesis, never an assertion of that company's budget. The batch workflow uses at most10 basic Tavily requests,20 candidates per request, stops at the selected target (20/50/100), deduplicates domains, filters closed/directory/referral-only/unconfirmed results, retains completed results on cancel, and aborts on navigation. Actual result counts can be below the target. CSV export contains provenance and assumptions.

Validation: `node scripts/verify-search.mjs`, `node scripts/verify-research.mjs`, TypeScript check and Sites build. The research tests cover strict URLs, deadlines/closure, irrelevant listings,100 unique company records and7 public compensation examples. Browser QA covers desktop/narrow viewport filters, saving jobs and prospects, and a100-row CSV. No messages or applications were sent; the Site stays owner-private.

# Interview Atlas — private job search workspace

The production Site is restricted to its owner. Do not change the audience when deploying. Existing D1 records, R2 files and the persistent `USER_KEY_ENCRYPTION_KEY` must be preserved.

## Search workflow (November 2026)

- Default: cached live-source catalog, no external search key required. Refresh follows provider intervals; no coverage or availability guarantee.
- Select a parent category alone, an optional branch, or a specific leaf. Changing parents clears incompatible child selections. All levels share the same matching and external query taxonomy.
- Keyword tokens use AND, with case and full-width normalization. Category, skills, geography, experience, English calls, contract, pay unit and pay floor combine with AND in catalog searches. Missing evidence is kept distinct from eligibility.
- Tavily Web search sends the selected conditions as a query, returns up to 10 source links, and does not claim exact filter compliance. Default basic search uses one credit. Google search is available without a key.
- Settings show a three-step Tavily setup. Keys are pasted in a password field, encrypted and saved server-side; they are never added to browser storage or the source repository. Nonsecret filters are retained in session storage only for a settings round trip.
- Saved jobs have their own catalog search and remain usable without Tavily. Account records use Sites identity; guest preview records are browser-local. Gmail and Calendar remain manual handoffs.

Checks: `node scripts/verify-search.mjs`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, then the Sites build helper. Search checks cover parent/branch/leaf coverage, keyword AND, full-width text, combined matching and the Tavily request/error contract with mocked network calls. Browser QA uses current public-source data at desktop and narrow CSS viewport widths. A real valid Tavily key is needed to verify an end-to-end provider request; do not store QA placeholder keys in production.

---

# Interview Atlas

Private initial release focused on voice mock interviews. English/Japanese prompts, coaching and five-question modes, recording/playback, per-user D1 records and private R2 audio, manual job entry and filters, profile forms. Tavily job searches and Gemini evaluations use visitor-provided keys encrypted server-side in R2. Settings responses never return stored keys. Provider output is displayed as plain text.

## Setup

Obtain a free-tier key at https://aistudio.google.com/apikey and verify current model availability and pricing at https://ai.google.dev/gemini-api/docs/pricing . Enter the key in Settings; do not paste into chat. The default model ID can be changed. Never assume the free tier is unlimited or that a key belongs to a free project. Free-tier inputs may be used by Google to improve services.

## Current limitations

Initial release is owner-private. Invitation membership, scheduled job ingestion, URL scraping, Gmail sending/reading, calendar automation and automatic FX conversion are not implemented. UI labels these accurately. Speech recognition depends on browser support and may use browser-vendor services; recordings remain available when transcription is unsupported. Recorded audio is submitted to Gemini only on explicit evaluation. Current questions are a fixed development interview set; job text is referenced by evaluation, not dynamically generated prompts. Profile is not sent to AI in this release.

Audio: 5 minute client recording limit, 12MB server size limit, 30 audio recordings per user. Account data is guarded by request identity and all read/write/audio/delete queries scope by owner. Mutation routes validate same-origin. API evaluation cannot be verified without a user's key. Mobile hardware microphone and push notifications require device testing.

## Opportunity workspace (v2)

Public `/api/jobs` reads a shared public catalog. Job data comes from fixed Himalayas API searches, not arbitrary user-provided URLs. Attribution and applicationLink are retained. Contract/part-time and development category filters are enforced before persistence. Each refresh scans up to 480 feed rows; duplicates are keyed by source guid. This is not an exhaustive global crawl. Listings expire by provider expiry date and are hidden when last seen more than 26 hours ago. Presence in the cached feed does not prove an employer has not closed the role early.

Experience and speaking rules use conservative explicit text matching and show matched evidence. English descriptions do not establish English-only eligibility. Country of employer remains unknown unless manually entered. Conflicts between provider residence arrays and clear text restrictions are shown for review. Frankfurter reference FX preserves the salary period; unlike pay periods are not directly compared.

Signed-in `/api/jobs` POST and authenticated MCP `refresh_job_catalog` use the same 24-hour source lock. MCP `job_catalog_status` exposes only public catalog counts and source state. Schedule through the Site's linked task only when the hosted tool connection is available and verified. No secrets are stored in scheduled prompts.

Guest bookmarks/proposals are explicitly browser-local. Signed-in data remains owner scoped in D1. Email templates use provided profile text, never fabricated credentials. Gmail compose is a handoff, not automated sending. Calendar ICS exports include DISPLAY alarms at 24h, 1h and 10m. No Gmail read/send or Calendar OAuth integration exists in this release. Free ChatGPT is a manual prompt-copy and chat-opening workflow, not embedded AI or automatic sync. Portfolio tasks persist independently per owner or in guest local storage.

## Reliability repairs (v3)

Public catalog reads now use a fixed-source read-through cache, so opening the app initializes an empty catalog and refreshes a stale one without a separate plugin or visitor login. The global D1 source lock prevents concurrent refreshes; successful source snapshots have a 24-hour minimum interval and failed attempts have a 15-minute backoff. Upstream calls have bounded deadlines. Do not describe browser-triggered refresh as an unattended job. The previous linked automation is paused pending independent verification of a supported unattended path.

Guests can store a profile in their own browser. Account-only recording saves are explicitly labeled; guests can download recorded audio. Navigation during recording is blocked until Stop. Microphone failure releases tracks. Audio endpoints support authenticated byte-range reads. Multipart request size is bounded before parsing; records must be objects; audio uploads are session-only; failed database inserts clean up the newly uploaded audio. Session records cannot be rewritten through generic updates. The ICS end time is calculated on wall-clock UTC arithmetic so it does not inherit the browser's unrelated timezone when exported with a selected TZID.

Run `node scripts/check-workspace.mjs` and `npx tsc --noEmit`. The check script tests the actual transpiled route handlers with real in-memory SQLite and a scoped in-memory object-store adapter; it does not forge production identity. Tests cover unauthenticated access, owner isolation, audio ranges, cross-origin writes, oversized bodies, invalid records, provider quota responses, fixed-source refresh concurrency, failure preservation, and conservative classification. These checks do not establish microphone behavior on physical phones, provider billing status, or live Gmail/Calendar integration.

## Catalog quality repairs (v4)

Role eligibility now uses the actual title with explicit exclusions for business development, content/course writing, instruction, and support rather than broad job-board category tags. The default display requires detected English requirement/application evidence; unknown language and additional-language requirements remain separate selectable filters. English evidence is not a guarantee that work can be completed in English alone. Existing cached rows are reclassified at read time, so rule fixes take effect without forcing extra upstream API calls. Country-of-residence matching accepts major Japanese aliases and ISO codes and includes worldwide roles. Lists render 30 rows at a time. Source diagnostics distinguish the number of fetched rows from currently valid records.

The linked periodic check now opens the public app and verifies the source-status page rather than depending on unavailable Site-plugin tools. This is the same public read-through path verified manually after deployment. A saved enabled schedule is not proof that its next unattended run has succeeded.

## Multi-source discovery (v6)

Jobicy is a second source, checked no more than once per 3 hours. Discovery walks up to 3 cursor pages (300 recent rows); employment type and actual development title are enforced before import. Jobicy batch status checks must explicitly return active; unknown/closed are excluded. Retained records are also rechecked beyond the 7-day discovery window. A 26-hour status-validity deadline is internal only, never presented as an application deadline. Public-source refreshes run independently in parallel with per-source D1 locks; source failure preserves other sources. Visible attribution and the original public Jobicy application URL are retained. No commercial API key or paid endpoint is used.

The world-source directory links to official marketplace homepages and explicitly separates manual URL registration from automatic collection. It is not a claim that Upwork, Freelancer, Contra, PeoplePerHour, Guru, Workana, CrowdWorks or Lancers have been automatically ingested. Upwork API approval and user-service authorization remain external prerequisites. Gmail/Calendar automatic account actions still require a supported authorized integration and are not implemented by a Gmail compose link or ICS file.


## Version 7 – additional public discovery
- Arbeitnow Europe and UK: separate fixed official APIs, maximum three pages each, three-hour successful cache, 15-minute failure backoff. Only explicit freelance/self-employed or part-time types are accepted; a generic employment “Contract” is insufficient. Positions absent from a successful snapshot are removed from the public catalog, never private saved records. Original URLs and evidence are preserved; unknown pay/deadline stay unknown. This is a bounded current feed snapshot, not an exhaustive world index.
- Jobicy cursor traversal increased from three to ten pages (maximum 1000 feed records), still obeying its source cache. Existing cached snapshots are not invalidated to force a fetch.
- Source attribution: https://www.arbeitnow.com/blog/job-board-api and https://www.arbeitnow.com/terms/
- Google hosted integration remains blocked: `sites_list_plugin_eligibility` is not exposed in this task. Native chat Gmail/Calendar access does not establish visitor Site eligibility. No connector IDs or capabilities were guessed, and no credentials were copied.

## Version 8 – interrupted request recovery
The Worker retains bounded request work with execution-context waitUntil so disconnecting crawler/visitor requests do not immediately abandon feed locks. The refresh traversal stops after 20 seconds, with an eight-second per-fetch timeout. Stale running statuses are explicitly labeled interrupted after two minutes; retry lock backoff stays 15 minutes. Arbeitnow workplace is separate from residence eligibility, which is unknown absent explicit evidence.

## Per-user AI credentials

`USER_KEY_ENCRYPTION_KEY` is a persistent 32-byte base64 secret configured in Sites runtime settings. Keep it unchanged across deployments; replacing it without re-encrypting existing records makes stored settings unreadable. Never add it to source or deployment manifests.

AI settings are encrypted using AES-GCM with the owner identity as authenticated data and stored under a SHA-256-derived private R2 path. Authenticated identities use Sites' account ID. Anonymous identities use a random 256-bit `__Host-atlas-guest` HttpOnly/Secure/SameSite=Strict cookie; guest records expire after 180 days. Guest settings do not automatically migrate to authenticated accounts. The settings API returns only status, model, consent and timestamp, never the saved key. Deleting saved settings does not revoke the key at Google. AI search and evaluation retrieve saved keys server-side; browser requests do not need to contain saved credentials.

## Tavily job search

The default search UI uses Tavily Search with `search_depth: basic`, `auto_parameters: false`, no generated answer, and up to ten results in a single provider request. Tavily credentials are saved through `/api/tavily/settings` in the existing encrypted vault with an additional `tavily:` owner namespace, so Gemini credentials are not replaced or reused. `/api/tavily/search` accepts conditions only, resolves the caller's saved key server-side, and surfaces authentication and quota failures without automatic retries or paid-plan upgrades. Web results are candidates, not confirmed-open jobs; users can review and manually register them. Groq summarization is not connected. A user-supplied Tavily key is required to verify live provider searches.


## Tavily free allowance and explicit actions
Tavily runs only after an explicit search, research, or test button action. Changing a query, category, or search mode never submits Tavily requests; loading/reloading reads key-free verified records. The primary-page refresh is also key-free.

The server checks official `GET /usage` immediately before an unconfirmed action. A recognized free/Researcher account, numeric plan usage/limit (at most 1,000), and no pay-as-you-go usage must cover the planned credits. Jobs may reduce two searches to one to use the final free credit without confirmation; key-free results supplement the smaller search. Key limits and browser counters never stand in for account free allowance. Same-key unconfirmed actions serialize with a token-owned, 120-second D1 lease in the existing receipts table; it releases in finally. The account can still change from other applications, and usage is not a billing guarantee.

Enough verified free credits skip device confirmation. Insufficient, unrecognized/paid plan, or unavailable usage returns 402 before any search is sent; the device then asks once for that explicit action. Cancel sends no search. Accept permits that action under the user's provider contract even if usage is unavailable. Company consent covers only the remaining requests of the current batch (maximum ten) and disappears when the action ends. No automatic search retries, plan changes, card operations, or closed-device push notifications occur. Connection tests retain atomic per-owner request receipts.

Official pricing is monthly 1,000 free credits, not 1,000 app searches: basic provider search is one credit; a jobs action plans two, a company batch up to ten, a connection test one. Provider authentication/quota/outage failures remain explicit. Tests use fixtures and never a user's key: `node scripts/verify-tavily-allowance.mjs`, `node scripts/verify-tavily-test-route.mjs`, `node scripts/verify-tavily-search-consent.mjs`, plus the existing source/search checks and TypeScript.

## Website search result repair
Website discovery now targets individual marketplace paths with a one-month search window and a maximum 24-hour provider cache. The parser recognizes HP修正/サイト改修, nested title spans, ISO/slash deadline dates, and full-text keyword matches; sales partners and appointment setters remain excluded. Verification caches use a new parser version. A provider's full source body can repair an unreadable direct response, but cannot override an explicit closed or expired result.

When provider results cannot yield any verified job, the route checks candidates from fixed official CrowdWorks category pages without another Tavily call. These are separately attributed as official-listing recovery. If that listing cannot be read, fresh verified research records are identified separately and remain subject to the same deadline and freshness checks. The same path is available as a key-free search option. Listing JSON supplies candidate URLs only; every displayed job still requires a full individual source page and a future deadline. Discovery is bounded to at most three categories and twenty candidates, not an exhaustive platform index. Search diagnostics report provider exclusions separately from recovered jobs. Existing origin checks, encryption, private Site access and explicit-button Tavily execution and allowance-aware confirmation are preserved.

Checks: `node scripts/verify-website-results.mjs`, `node scripts/verify-website-results-route.mjs`, `node scripts/verify-research.mjs`, `node scripts/verify-search.mjs`, and `npx tsc --noEmit`. Fixture-based provider tests do not spend real API credits. Live official-source/browser checks verify actual job cards independently of a user's saved Tavily key.

The Workers runtime rejects `redirect: "error"` before sending a request. Both official discovery and the Tavily connection test now use `manual` and handle non-success responses without following redirects or forwarding credentials to another origin.

Direct official HTML retrieval may fail in hosted runtime egress even when the same page can be read by the research process. Such a failure is reported in source diagnostics and uses the explicitly attributed verified research fallback; it is not presented as a successful fresh-list fetch. Research records still expire under their deadline and 24-hour verification rule. A real user-key Tavily search is not asserted by fixture tests.


## Thirty-result multi-site search and button states
The default key-free search combines CrowdWorks public category/detail pages, Coconala public requests (never service listings), and Freelancer.com's public active-project API. It returns up to 30 distinct matching records, balanced across available sources, with explicit per-source counts and partial-source diagnostics. It checks at most 45 CrowdWorks detail candidates and 10 Coconala candidates; Freelancer reads one bounded 100-record response. Filters can reduce the final count below 30. A shortfall is never filled with closed, duplicate or unrelated rows.

Freelancer records require official active/open status, full description and a public project URL, excluding private/hire-me/full-time/mobile-app/sales entries. Unknown deadline remains unknown; no deadline is invented from bidperiod. Native currencies are displayed unchanged and are not compared as JPY. Coconala nested budget ranges and explicit student-only eligibility are preserved. The directory exposes 35 domestic/global source links; only three are automatic, with remaining sources clearly marked as external confirmation or unconnected API access. Upwork HTML scraping is not enabled.

Tavily search now asks for up to two planned basic searches/2 credits before either request. A second-request failure preserves completed results, indicates uncertain additional credit consumption and never retries automatically. Overseas automatic search uses the free official-API path.

Buttons are white at rest, change colour only while pressed, selected or busy, and retain the last form action only until the input changes. A full reload starts at the job search page and drops transient return-to-settings state while preserving saved keys, records and user presets.

Validation includes `node scripts/verify-multi-site.mjs`, `node scripts/verify-website-results-route.mjs`, provider/registration/consent checks, TypeScript, and desktop/mobile-width browser interaction. Real public-source collection is checked separately from fixture tests.


## Japan-first coverage and nationwide company research
The initial market is Japan. Thirty domestic records were checked live from CrowdWorks and Coconala; the collector still targets up to thirty matching jobs when filters or source availability reduce the pool. Sales/referral partners and system-building tasks are excluded from the website-only view. The source catalog has 29 Japanese and six overseas entries, searchable/filterable connection status, official API guides for confirmed public programs, and an arbitrary official-domain external search for sources not yet registered. “Public API unconfirmed” does not assert that no API exists. GbizINFO is explicitly a documented but unimplemented connection, linked to its official application and API instructions; it does not establish partner recruitment or company budgets.

Company discovery covers all 47 prefectures sequentially with a maximum ten basic requests per explicit action. Completed indices and up to 1,000 distinct domains remain in this browser tab across reloads; continuing skips completed indices. Errors/stop preserve completed work, do not mark the interrupted index complete, and never auto-retry. The target of 100 new companies is not a guaranteed count. General production-company search requires official business evidence and labels partner recruitment unconfirmed; partner search requires explicit recruitment evidence. Search geography is kept separate from a verified address. CSV export contains both.

Run `node scripts/verify-national-companies.mjs` in addition to multi-site/consent checks. Company-provider requests are verified with fixtures, without spending the user's saved Tavily credits.

## 29 professions / seven fields
The primary search now covers the user's exact 29 professions across Web production, development, AI/automation, design, writing/translation, marketing, and data/research/QA. `lib/professions.ts` is the shared registry for displayed names, canonical categories, Japanese source queries, English API/external queries, verified domestic category IDs and contextual skill choices. Existing detailed categories and saved-record aliases remain usable.

Acquisition is role-specific, not a label-only change: CrowdWorks reads mapped public category lists, Coconala reads mapped public request categories, and Freelancer queries its active-project endpoint with each profession's English search term. Full source descriptions, deadlines or API active/open state, duplicates, closed/private/service listings and unrelated work are still checked. The old website-only predicate is retained for the broad Web-production view, while apps, backend, AI, writing and other requested roles have their own matching. Titles drive classification; a writer using ChatGPT/WordPress is not thereby an AI/WordPress developer. QA of an Android app is not classified as mobile development. Explicit RAG implementation requirements may supplement a chatbot title. Unknown experience remains unknown, conflicting requirements get a distinct label, and character-based writing prices are separated from hourly/fixed rates.

A search targets up to 30 matches; sparse categories can return fewer or zero. No counts are fabricated, and supported role discovery does not establish exhaustive platform coverage. Initial retained research is scoped to Web production; changing a role and pressing Search performs fresh role-specific acquisition. Recent verified research records can supplement a failed source, with previous-confirmation attribution and the same freshness/deadline requirements.

The refreshed interface uses one primary query action, seven fields, profession choices, optional fine categories and progressive disclosure of extra conditions. Results expose source, role, pay unit, deadline, evidence and save action. White-at-rest/selected-green buttons, keyboard focus, reduced motion, reload-to-search behavior, saved keys and owner-private access are preserved. Design references: https://m3.material.io/components/search/overview and https://m2.material.io/components/text-fields/web . The simplification goal removes redundant interaction before adding automation; no affiliation or endorsement is implied.

Validate with `node scripts/verify-professions.mjs` (all 29 roles across parser, source routing, domestic query, external query, live API query and cross-role exclusions), existing search/verification/consent/company tests, TypeScript and desktop/mobile-width browser QA. Provider tests use fixtures; separate live source probes use public listings and do not use a user's Tavily key.

Definitive closed/expired evidence overrides research fallback, including on a forced refresh and while switching to browser-retained results. Successful searches merge the fetched records into the browser's read-results mode; confirmed exclusions remove obsolete retained rows. Native select controls remain disabled until client hydration so a very early selection cannot be lost during startup.
