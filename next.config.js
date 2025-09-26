/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14+
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

module.exports = nextConfig
