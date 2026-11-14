# Owner requirements

- Keep this Site in free tester mode. The owner and two named testers must not incur external API charges.
- Do not enable paid-capable external APIs, subscriptions, usage-based billing, automatic credit purchases, new billable services or a paid hosting upgrade without the owner's explicit prior approval. Explain the exact cost, cap and payer, then obtain a separate final confirmation immediately before enabling.
- Ask the owner before major architecture, feature or sharing changes. Small UI, accessibility and bug fixes are authorized.
- Preserve the current owner-only audience until the owner identifies the two testers. Never make the Site public to solve invitation issues.
- Do not claim hosting is permanently free or that FREE_TEST_MODE controls provider hosting charges. Hosting usage and limits require a separate review before the free hosting period ends.
- Prefer small verified changes. Keep existing user data and API keys; never delete them merely to enforce the cost lock.

- Show an actionable service/price/free-tier/expiry guide when users choose API-dependent features; do not disable their entry points. Never invent expiry dates or require a paid plan where a free tier may suffice. Actual external calls remain gated until owner-approved connection and costs are verified.

- All job filter/preset/sort changes must wait for the explicit search button before affecting results. Tavily key registration alone stores encrypted credentials and must never trigger a charge-capable API call. Keep saved vs verified connection statuses distinct.

- Tavily接続確認だけは、ログイン済み利用者の2段階確認・単回トークンを必須とし、公式usageでResearcher・paygo_limit=0・無料残量を検証後に基本検索1回を許可する。他の外部検索・AI評価のロックは維持する。


# Latest owner decisions — 2026-11-13 (take precedence for Tavily)

- Tavily runs only after an explicit search, company research, or connection-test button action. Do not search on query edits, category edits, mode changes, key registration, or reload.
- Official account free allowance is 1,000 credits per month, not 1,000 app actions. Jobs use up to two basic requests; the last free credit permits one request with key-free supplementation.
- When the server can verify enough free account credits through /usage, do not show a recurring device confirmation. When free allowance is exhausted or cannot be verified, ask on the initiating device before sending the search. Cancel sends no search; acceptance covers only the current explicit action.
- These owner decisions supersede older Tavily requirements above for two-stage tokens, paygo_limit=0, mandatory per-action confirmations, or blanket paid-capable API locks. Preserve existing encryption, same-origin checks, request receipts, no automatic retries, and other AI cost locks. Never change plans or purchase credits automatically.
- Preserve the owner-only audience. Local development does not deploy to Sites. Never include .dev.vars, .env, runtime state, personal records, tokens, or node_modules in a shared archive.

# Latest owner decisions — 2026-11-14 (URL share + billing hold)

- URL-knowers may use a shared Workers URL protected by SHARE_ACCESS_TOKEN. Do not make Sites broadly public.
- Keep Cloudflare Workers / D1 / R2 on free tier only. Do not enable Paid plans, auto credit purchase, or other billable hosting upgrades without a separate final owner confirmation naming cost, cap, and payer.
- When Tavily free allowance is exhausted or cannot be verified, stop the action. Do not let device confirmation authorize paid use. Show users: 「これ以降は課金が必要なので深夜特急の承認待ちです」. Resume paid-capable actions only when OWNER_BILLING_APPROVED=1 is explicitly set by the owner.
