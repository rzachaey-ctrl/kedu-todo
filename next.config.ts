import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: 'export',
        basePath: '/kedu-todo',
        assetPrefix: '/kedu-todo/',
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
