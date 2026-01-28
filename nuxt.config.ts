export default defineNuxtConfig({
  // Runtime config for environment variables
  runtimeConfig: {
    turnstileSecretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    public: {
      turnstileSiteKey: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY
    }
  },

  // Add security headers via Nitro
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Robots-Tag': 'noindex, noarchive, nosnippet, noimageindex'
        }
      }
    }
  },

  // App-level meta tags
  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, noarchive, nosnippet, noimageindex' }
      ]
    }
  },

  devtools: { enabled: true }
})
