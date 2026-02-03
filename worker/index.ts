/**
 * Cloudflare Worker for GitHub OAuth token exchange
 *
 * Deploy this worker and set the following environment variables:
 * - GITHUB_CLIENT_ID: Your GitHub OAuth App Client ID
 * - GITHUB_CLIENT_SECRET: Your GitHub OAuth App Client Secret
 * - ALLOWED_EXTENSION_ID: Your Chrome extension ID (optional, for CORS)
 */

interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  ALLOWED_EXTENSION_ID?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
}

interface ErrorResponse {
  error: string
  error_description?: string
}

// Simple in-memory rate limiter (resets on worker restart)
const rateLimiter = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 10

  const requests = rateLimiter.get(ip) || []
  const recent = requests.filter((t) => now - t < windowMs)

  if (recent.length >= maxRequests) {
    return true
  }

  recent.push(now)
  rateLimiter.set(ip, recent)
  return false
}

function getCorsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin')

  // Allow Chrome extension origins
  const allowedOrigins: string[] = []

  if (env.ALLOWED_EXTENSION_ID) {
    allowedOrigins.push(`chrome-extension://${env.ALLOWED_EXTENSION_ID}`)
  }

  // In development, also allow localhost
  if (origin?.startsWith('chrome-extension://')) {
    // For Chrome extensions, we can be more permissive since they have their own ID
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  }

  return {}
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request, env)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)

    if (url.pathname === '/exchange' && request.method === 'POST') {
      // Rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
      if (isRateLimited(clientIP)) {
        return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429, corsHeaders)
      }

      try {
        const body = await request.json<{ code: string }>()
        const { code } = body

        if (!code || typeof code !== 'string') {
          return jsonResponse({ error: 'Missing authorization code' }, 400, corsHeaders)
        }

        // Validate code format (should be alphanumeric)
        if (!/^[a-zA-Z0-9]+$/.test(code)) {
          return jsonResponse({ error: 'Invalid authorization code format' }, 400, corsHeaders)
        }

        // Exchange code for access token
        const tokenResponse = await fetch(
          'https://github.com/login/oauth/access_token',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: env.GITHUB_CLIENT_ID,
              client_secret: env.GITHUB_CLIENT_SECRET,
              code,
            }),
          }
        )

        const data = await tokenResponse.json<TokenResponse | ErrorResponse>()

        if ('error' in data) {
          // Don't expose detailed error messages
          console.error('GitHub OAuth error:', data.error, data.error_description)
          return jsonResponse({ error: 'Authentication failed. Please try again.' }, 400, corsHeaders)
        }

        return jsonResponse({ access_token: data.access_token }, 200, corsHeaders)
      } catch (error) {
        console.error('Token exchange error:', error)
        return jsonResponse({ error: 'Authentication failed. Please try again.' }, 500, corsHeaders)
      }
    }

    return jsonResponse({ error: 'Not found' }, 404, corsHeaders)
  },
}

function jsonResponse(data: object, status = 200, corsHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}
