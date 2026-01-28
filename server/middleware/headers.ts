import { defineEventHandler, setHeader, getHeader, createError } from 'h3'

const ARCHIVER_BOTS = ['ia_archiver', 'archive.org_bot', 'wayback', 'httrack']

export default defineEventHandler((event) => {
  const ua = getHeader(event, 'user-agent')?.toLowerCase() || ''

  // Block known archivers at server level too
  if (ARCHIVER_BOTS.some(bot => ua.includes(bot))) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  // Add anti-indexing headers to all responses
  setHeader(event, 'X-Robots-Tag', 'noindex, noarchive, nosnippet, noimageindex')
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, private')
  setHeader(event, 'Pragma', 'no-cache')
})
