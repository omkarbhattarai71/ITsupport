/** @type {import('next').NextConfig} */

const IS_PROD = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────────────────
//  Content Security Policy
//  Only allow resources from trusted sources. Adjust as needed if you add
//  additional CDNs or third-party services.
// ─────────────────────────────────────────────────────────────────────────────
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://login.microsoftonline.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https: ${IS_PROD ? '' : 'http://localhost:3001'};
  connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com ${
    IS_PROD ? '' : 'http://localhost:3001'
  };
  frame-src 'self' https://login.microsoftonline.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
    .replace(/\s{2,}/g, ' ')
    .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // ─────────────────────────────────────────────────────────────────────────
    //  API proxying — forward all /api/* to Express, except /api/auth/*
    //  which is handled by NextAuth.js internally.
    // ─────────────────────────────────────────────────────────────────────────
    async rewrites() {
        return [
            {
                source: '/api/:path((?!auth/).*)',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
            },
        ];
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  HTTP Security Headers
    //  Applied to every page and API route served by Next.js.
    // ─────────────────────────────────────────────────────────────────────────
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // Prevent clickjacking
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // Prevent MIME-type sniffing
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Referrer information — only send origin, not full URL
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Disable browser features not needed by this app
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
                    },
                    // Content Security Policy
                    { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
                    // HSTS — only in production (prevents mixed-content in dev)
                    ...(IS_PROD
                        ? [
                              {
                                  key: 'Strict-Transport-Security',
                                  value: 'max-age=63072000; includeSubDomains; preload',
                              },
                          ]
                        : []),
                    // Remove the "Powered by Next.js" header
                    { key: 'X-Powered-By', value: '' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
