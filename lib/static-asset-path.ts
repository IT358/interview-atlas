/**
 * Paths that should be served from the Workers Assets binding after the share gate.
 * Everything else (HTML SSR, /api/*, /mcp) must reach the vinext fetch handler.
 * Blindly returning any non-404 ASSETS response can hand HTML to JSON clients.
 */
export function isStaticAssetPath(pathname: string): boolean {
  if (!pathname || pathname.includes('\0') || pathname.includes('..')) return false;
  if (pathname.startsWith('/api/') || pathname === '/api') return false;
  if (pathname.startsWith('/mcp/') || pathname === '/mcp') return false;
  if (pathname.startsWith('/_next/static/')) return true;
  if (pathname.startsWith('/tavily-guide/')) return true;
  if (pathname === '/favicon.svg' || pathname === '/favicon.ico') return true;
  if (pathname === '/vinext-client-entry-manifest.json') return true;
  return /\.(?:css|js|mjs|map|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|txt|json)$/i.test(pathname);
}
