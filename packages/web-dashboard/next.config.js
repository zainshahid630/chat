/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chatdesk/shared'],
  images: {
    domains: [],
  },
}

module.exports = nextConfig

