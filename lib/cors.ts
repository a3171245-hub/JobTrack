const ALLOWED_BROWSER_ORIGINS = [
  'https://job-track-tawny.vercel.app',
  'https://jobtrack.jp',
  'https://www.jobtrack.jp',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

/**
 * Returns the appropriate Access-Control-Allow-Origin value.
 * - Known browser origins → echo back the origin
 * - Chrome/Firefox extensions → echo back the origin (JWT is the real auth)
 * - Unknown origins → return first allowed origin (browser will block mismatch)
 */
function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_BROWSER_ORIGINS[0]
  if (ALLOWED_BROWSER_ORIGINS.includes(requestOrigin)) return requestOrigin
  if (
    requestOrigin.startsWith('chrome-extension://') ||
    requestOrigin.startsWith('moz-extension://')
  ) {
    return requestOrigin
  }
  // Unknown origin: return a non-matching value — browser will block the read
  return ALLOWED_BROWSER_ORIGINS[0]
}

export function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(requestOrigin),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function corsPreflightResponse(requestOrigin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(requestOrigin),
  })
}
