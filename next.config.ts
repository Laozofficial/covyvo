import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lean, self-contained server bundle for the Docker image (.next/standalone).
  output: 'standalone',
}

export default nextConfig