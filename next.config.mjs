/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
  outputFileTracingRoot: '.',
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dev.tasksplan.com/bondyBackend/api/v1';
    return [
      {
        source: '/public/ticket',
        has: [
          {
            type: 'query',
            key: 'download',
            value: 'true',
          },
          {
            type: 'query',
            key: 'id',
            value: '(?<id>[^&]+)',
          },
        ],
        destination: `${apiUrl}/booking/public/ticket/download/:id`,
      },
    ];
  },
};
export default nextConfig;
