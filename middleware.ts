// Vercel Edge Middleware (uses Web Standard APIs, not Next.js)

// Paths that should bypass protection entirely
const BYPASS_PATHS = [
  '/challenge',
  '/api/verify-session',
  '/_nuxt',
  '/favicon.ico',
  '/robots.txt',
  '/_robots.txt',
  '/__nuxt',
]

// Static file extensions to bypass
const STATIC_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.map', '.wasm']

// Known archiver user agents
const ARCHIVER_BOTS = [
  'ia_archiver',
  'archive.org_bot',
  'wayback',
  'httrack',
  'wget/1',
  'curl/',
  'python-requests',
  'go-http-client',
  'scrapy',
  'phantomjs',
  'headlesschrome',
]

export const config = {
  matcher: [
    /*
     * Match all paths except static files
     */
    '/((?!_nuxt/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map|wasm)$).*)',
  ],
}

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url)
  const pathname = url.pathname
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''

  // Bypass static extensions
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return undefined // Continue to origin
  }

  // Bypass certain paths
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return undefined // Continue to origin
  }

  // Block known archivers
  if (ARCHIVER_BOTS.some(bot => userAgent.includes(bot))) {
    return new Response('Access Denied', { status: 403 })
  }

  // Check for session cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const hasSession = cookieHeader.includes('__session_validated=')

  // If no session, redirect to challenge
  if (!hasSession) {
    const challengeUrl = new URL('/challenge', request.url)
    challengeUrl.searchParams.set('redirect', pathname + url.search)
    return Response.redirect(challengeUrl.toString(), 302)
  }

  // Continue with anti-caching headers
  // Note: Headers are added by returning undefined and letting server middleware handle it
  return undefined
}
