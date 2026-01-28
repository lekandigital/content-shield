<script setup lang="ts">
definePageMeta({
  layout: false  // CRITICAL: Don't use any Docus layout
})

const route = useRoute()
const config = useRuntimeConfig()
const siteKey = config.public.turnstileSiteKey as string

const status = ref<'loading' | 'verifying' | 'success' | 'error'>('loading')
const errorMessage = ref('')
const widgetId = ref<string | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const redirectTo = computed(() => (route.query.redirect as string) || '/')

onMounted(async () => {
  if (!siteKey) {
    status.value = 'error'
    errorMessage.value = 'Configuration error'
    return
  }

  try {
    await loadTurnstile()
    renderWidget()
  } catch (e) {
    status.value = 'error'
    errorMessage.value = 'Failed to load verification'
  }
})

function loadTurnstile(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve()

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => {
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check)
          resolve()
        }
      }, 50)
      setTimeout(() => { clearInterval(check); reject(new Error('Timeout')) }, 10000)
    }
    script.onerror = () => reject(new Error('Script failed'))
    document.head.appendChild(script)
  })
}

function renderWidget() {
  if (!window.turnstile || !containerRef.value) return

  widgetId.value = window.turnstile.render(containerRef.value, {
    sitekey: siteKey,
    size: 'invisible',
    callback: onSuccess,
    'error-callback': () => onError('Challenge failed'),
    'timeout-callback': () => onError('Challenge timed out')
  })
  // Invisible widgets auto-execute - DO NOT call execute()
}

async function onSuccess(token: string) {
  status.value = 'verifying'
  try {
    await $fetch('/api/verify-session', {
      method: 'POST',
      body: { token }
    })
    status.value = 'success'
    setTimeout(() => { window.location.href = redirectTo.value }, 300)
  } catch {
    status.value = 'error'
    errorMessage.value = 'Verification failed'
  }
}

function onError(msg: string) {
  status.value = 'error'
  errorMessage.value = msg
}

function retry() {
  status.value = 'loading'
  errorMessage.value = ''
  if (widgetId.value && window.turnstile) {
    window.turnstile.reset(widgetId.value)
  } else {
    renderWidget()
  }
}

// TypeScript declaration
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}
</script>

<template>
  <Html>
    <Head>
      <Title>Verifying...</Title>
      <Meta name="robots" content="noindex, noarchive" />
    </Head>
    <Body class="bg-gray-100 dark:bg-gray-900">
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center p-8 max-w-md">
          <template v-if="status === 'loading' || status === 'verifying'">
            <div class="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              {{ status === 'loading' ? 'Loading...' : 'Verifying...' }}
            </p>
          </template>

          <template v-else-if="status === 'success'">
            <div class="text-green-500 text-4xl mb-4">✓</div>
            <p class="text-gray-600 dark:text-gray-400">Verified! Redirecting...</p>
          </template>

          <template v-else-if="status === 'error'">
            <div class="text-red-500 text-4xl mb-4">!</div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">{{ errorMessage }}</p>
            <button
              @click="retry"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Try Again
            </button>
          </template>

          <div ref="containerRef" class="absolute opacity-0 pointer-events-none" />
        </div>
      </div>
    </Body>
  </Html>
</template>

<style>
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
