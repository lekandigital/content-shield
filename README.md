# Content Shield

A lightweight content protection layer for documentation sites. Helps manage access to your content and control how it's consumed.

Built with [Nuxt 4](https://nuxt.com) and [Docus](https://docus.dev).

## Features

- Edge-level request filtering
- Session-based access control
- Cloudflare Turnstile integration
- Works with Vercel Edge Middleware

## Prerequisites

- Node.js 18+
- A [Cloudflare](https://cloudflare.com) account (for Turnstile)
- A [Vercel](https://vercel.com) account (for deployment)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/lekandigital/content-shield.git
cd content-shield
npm install
```

### 2. Cloudflare Turnstile Setup

Turnstile provides invisible challenge verification.

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Turnstile** in the sidebar
3. Click **Add Site**
4. Configure your site:
   - **Site name**: Any descriptive name
   - **Domain**: Your production domain (e.g., `yourdomain.com`)
   - **Widget Mode**: Select **Invisible**
5. After creation, copy your **Site Key** and **Secret Key**

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in the values:

```env
# Cloudflare Turnstile (from step 2)
CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key_here
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key_here

# Session signing secret (generate a random 64-char hex string)
SESSION_SECRET=your_session_secret_here
```

To generate a session secret:

```bash
openssl rand -hex 32
```

### 4. Local Development

```bash
npm run dev
```

Your site will be available at `http://localhost:3000`

**Note**: For local development, add `localhost` as an allowed domain in your Turnstile widget settings.

### 5. Vercel Deployment

#### Option A: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

#### Option B: Deploy via GitHub Integration

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `CLOUDFLARE_TURNSTILE_SITE_KEY`
   - `CLOUDFLARE_TURNSTILE_SECRET_KEY`
   - `SESSION_SECRET`
5. Deploy

#### Vercel Environment Variables

In your Vercel project settings:

1. Go to **Settings** > **Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development** environments

### 6. Domain Configuration

After deployment:

1. Add your custom domain in Vercel project settings
2. Update your Turnstile widget to include the new domain
3. Ensure DNS is properly configured (Vercel provides instructions)

## How It Works

1. **Edge Middleware** (`middleware.ts`): Intercepts requests at the edge before they reach your app
2. **Challenge Page** (`app/pages/challenge.vue`): Presents Turnstile verification to users
3. **Session Verification** (`server/api/verify-session.post.ts`): Validates Turnstile tokens and issues session cookies
4. **Security Headers** (`server/middleware/headers.ts`): Adds protective headers to all responses

## Configuration

### Customizing Blocked User Agents

Edit the `ARCHIVER_BOTS` array in `middleware.ts`:

```typescript
const ARCHIVER_BOTS = [
  'ia_archiver',
  'archive.org_bot',
  // Add more as needed
]
```

### Customizing Bypass Paths

Edit the `BYPASS_PATHS` array in `middleware.ts` for paths that should skip verification:

```typescript
const BYPASS_PATHS = [
  '/challenge',
  '/api/verify-session',
  '/public-page',  // Add paths here
]
```

### Session Duration

Modify the `maxAge` in `server/api/verify-session.post.ts`:

```typescript
setCookie(event, '__session_validated', cookieValue, {
  maxAge: 60 * 60 * 24, // 24 hours (in seconds)
})
```

## Content

Place your markdown documentation in the `content/` directory. See [Docus documentation](https://docus.dev) for content authoring guides.

## Troubleshooting

### Turnstile not loading

- Verify your site key is correct
- Check that your domain is added to the Turnstile widget
- For localhost, ensure `localhost` is in allowed domains

### Session not persisting

- Check that `SESSION_SECRET` is set
- Verify cookies are being set (check browser dev tools)
- Ensure `secure: true` is only used in production (handled automatically)

### 403 errors in development

- Some development tools may trigger the user-agent filter
- Check if your request headers match any blocked patterns

## License

MIT
