import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isVercelBuild =
    command === 'build' && (process.env.VERCEL === '1' || process.env.VERCEL === 'true')

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
