/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                // Proxy all /api/* to Express EXCEPT /api/auth/*
                // NextAuth.js handles /api/auth/* internally inside Next.js
                source: '/api/:path((?!auth/).*)',
                destination: 'http://localhost:3001/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
