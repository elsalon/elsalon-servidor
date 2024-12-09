import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const allowedOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

    return [
      {
        source: '/:path*',
        has: [
          {
            type: "header",
            key: "Origin",
            value: 'http://localhost:8080' // This is the origin of your frontend
          }
        ],
        headers: [
          {
            key: "Access-Control-Allow-Origin", 
            value: 'http://localhost:8080' // Match exactly as it is sent in requests
          },
          {
            key: "Access-Control-Allow-Methods", 
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: "Access-Control-Allow-Headers", 
            value: 'Content-Type, Authorization'
          },
          {
            key: "Access-Control-Allow-Credentials", 
            value: 'true' // Important if you need to send cookies/auth headers
          },
        ],
      },
    ]
  }
}

export default withPayload(nextConfig)
