import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { requestHasShareAccess, shareCookieHeader, shareGateActive, shareGateHtml, shareToken } from "../lib/share-access";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if (shareGateActive(env as any) && !requestHasShareAccess(request, env as any)) {
      const url = new URL(request.url);
      const access = url.searchParams.get("access") || "";
      const expected = shareToken(env as any);
      if (expected && access && access === expected) {
        url.searchParams.delete("access");
        return new Response(null, {
          status: 302,
          headers: {
            Location: url.pathname + url.search + url.hash,
            "Set-Cookie": shareCookieHeader(expected, url.protocol === "https:"),
            "Cache-Control": "private, no-store",
          },
        });
      }
      return new Response(shareGateHtml(), {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
      });
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = Promise.resolve(runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx)));
    // Finish bounded source refreshes even if a crawler or visitor disconnects mid-request.
    ctx.waitUntil(response.then(() => undefined, () => undefined));
    return response;
  },
};

export default worker;
