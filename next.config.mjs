/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
  outputFileTracingRoot: '.',
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
