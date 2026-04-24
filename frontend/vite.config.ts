import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function validateApiUrl(rawValue?: string) {
  const value = rawValue?.trim()
  if (!value) {
    return
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(
      `Invalid VITE_API_URL "${value}". It must be a full URL like https://example.lambda-url.ap-south-1.on.aws`
    )
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Invalid VITE_API_URL "${value}". Only http and https URLs are supported.`)
  }

  if (parsed.hostname.includes('lambda-uurl')) {
    throw new Error(
      `Invalid VITE_API_URL "${value}". Did you mean "lambda-url" instead of "lambda-uurl"?`
    )
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isVercelBuild =
    command === 'build' && (process.env.VERCEL === '1' || process.env.VERCEL === 'true')

  validateApiUrl(env.VITE_API_URL)

  if (isVercelBuild && !env.VITE_API_URL?.trim()) {
    throw new Error(
      'Missing VITE_API_URL for Vercel build. Set it to your backend base URL (example: https://api.example.com).'
    )
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
