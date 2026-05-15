import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import requestRoutes from './routes/requests';
import ticketRoutes from './routes/tickets';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

// ─────────────────────────────────────────────────────────────────────────────
//  Startup environment guard
//  The server will refuse to start if any required variable is missing.
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_ENV_VARS = [
    'JWT_SECRET',
    'DATABASE_URL',
    'AZURE_AD_TENANT_ID',
    'AZURE_AD_CLIENT_ID',
];

for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
        console.error(`❌  Missing required environment variable: ${envVar}`);
        console.error('    Set it in backend/.env and restart the server.');
        process.exit(1);
    }
}

// Reject the default weak JWT secret in production
if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'fcn-it-support-secret-key-change-in-production'
) {
    console.error('❌  JWT_SECRET is set to the default placeholder value in production!');
    console.error('    Generate a secure secret with:');
    console.error('    node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─────────────────────────────────────────────────────────────────────────────
//  Security headers — helmet sets safe defaults for:
//  X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, and more.
// ─────────────────────────────────────────────────────────────────────────────
app.use(
    helmet({
        // Allow the same-origin front-end to call the API from a browser
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        // Relax CSP for API server (no HTML pages served here)
        contentSecurityPolicy: IS_PROD
            ? undefined  // use helmet's strict default in production
            : false,     // disabled for dev convenience
    })
);

// ─────────────────────────────────────────────────────────────────────────────
//  CORS — only the configured origin may send credentialed requests
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─────────────────────────────────────────────────────────────────────────────
//  Body parsing — hard cap at 10 KB to prevent large-payload DoS
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────────────────
//  Rate limiting
// ─────────────────────────────────────────────────────────────────────────────

// Global limiter: 200 requests per 15 minutes per IP (covers all endpoints)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

// Strict limiter for the SSO token exchange: 15 attempts per 15 minutes per IP
// This prevents brute-force / token-farming attacks on the auth endpoint.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' },
    skipSuccessfulRequests: true, // don't count successful logins against the limit
});

app.use(globalLimiter);

// ─────────────────────────────────────────────────────────────────────────────
//  API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth/sso', authLimiter);   // tighter limit on the SSO exchange
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Base endpoints
app.get('/', (_req, res) => {
    res.json({ message: 'FCN IT Support Backend is running.' });
});

app.get('/api', (_req, res) => {
    res.json({ message: 'FCN IT Support API. See /api/health' });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Global error handler
//  Never leaks stack traces to the client — only logs them server-side.
// ─────────────────────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Log the full error internally
    console.error('[Unhandled Error]', err);
    // Return a safe, generic response to the client
    res.status(500).json({ error: 'An internal server error occurred.' });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🔄 Reload triggered...`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔒 Security headers: ${IS_PROD ? 'strict (production)' : 'relaxed (development)'}`);
    console.log(`🌐 CORS origin: ${ALLOWED_ORIGIN}`);
    console.log(`📋 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
