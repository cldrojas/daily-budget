/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@googleapis/gmail'],
  env: {
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  },
  allowedDevOrigins: ['192.168.1.6']
}

export default nextConfig
