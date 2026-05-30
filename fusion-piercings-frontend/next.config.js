/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jyxtouunksikuwhmauqq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // ESLint and TypeScript errors now fail the build, so broken code can't ship.
};

module.exports = nextConfig;