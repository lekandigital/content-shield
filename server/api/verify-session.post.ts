import { defineEventHandler, readBody, getHeader, setCookie, createError } from 'h3'
import { createHmac } from 'crypto'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secretKey = config.turnstileSecretKey as string
  const sessionSecret = config.sessionSecret as string

  const body = await readBody(event)
  const token = body?.token

  if (!token) {
    throw createError({ statusCode: 400, message: 'Missing token' })
  }

  // Verify with Cloudflare
  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)
  formData.append('remoteip', getHeader(event, 'x-forwarded-for') || '')

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  })

  const result: TurnstileResponse = await response.json()

  if (!result.success) {
    console.error('[verify-session] Turnstile failed:', result['error-codes'])
    throw createError({ statusCode: 403, message: 'Verification failed' })
  }

  // Create signed session cookie
  const timestamp = Date.now()
  const signature = createHmac('sha256', sessionSecret).update(timestamp.toString()).digest('hex')
  const cookieValue = Buffer.from(JSON.stringify({ timestamp, signature })).toString('base64')

  setCookie(event, '__session_validated', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })

  return { success: true }
})
