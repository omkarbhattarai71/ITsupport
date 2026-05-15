import { Router, Response } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const TENANT_ID = process.env.AZURE_AD_TENANT_ID!;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!;

// Allowed company domains — only these email domains may access the app
const ALLOWED_DOMAINS = ['fcn.dk', 'fcmasar.com', 'righttodream.com'];

// ─────────────────────────────────────────────────────────────────────────────
//  Microsoft JWKS client
//  Fetches Microsoft's public signing keys and caches them for 24 hours so
//  every SSO login doesn't trigger an outbound HTTP call.
// ─────────────────────────────────────────────────────────────────────────────
const microsoftJwksClient = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
    cache: true,
    cacheMaxAge: 86_400_000, // 24 hours
    rateLimit: true,
    jwksRequestsPerMinute: 5,
});

function getSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
    microsoftJwksClient.getSigningKey(header.kid!, (err, key) => {
        if (err) return callback(err);
        callback(null, key?.getPublicKey());
    });
}

/**
 * Cryptographically verify a Microsoft-issued ID token using JWKS.
 * Validates: signature, audience (our app), issuer (our tenant), expiry.
 */
function verifyMicrosoftToken(idToken: string): Promise<{
    email?: string;
    preferred_username?: string;
    name?: string;
    oid?: string;
    tid?: string;
}> {
    return new Promise((resolve, reject) => {
        jwt.verify(
            idToken,
            getSigningKey,
            {
                // Audience must be our Azure app — prevents tokens issued for
                // other applications from being accepted here.
                audience: CLIENT_ID,
                // Issuer covers v2.0 and v1.0 token endpoints
                issuer: [
                    `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
                    `https://sts.windows.net/${TENANT_ID}/`,
                ],
                algorithms: ['RS256'],
            },
            (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded as any);
            }
        );
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/sso
//  Called by the frontend after Microsoft SSO succeeds.
//  The Microsoft ID token (from the NextAuth session) is cryptographically
//  verified here before we trust any of its claims.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sso', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken || typeof idToken !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid ID token' });
        }

        // ── CRITICAL: verify signature, audience, issuer, and expiry ──
        let decoded: Awaited<ReturnType<typeof verifyMicrosoftToken>>;
        try {
            decoded = await verifyMicrosoftToken(idToken);
        } catch (verifyErr: any) {
            console.warn('Microsoft token verification failed:', verifyErr?.message);
            return res.status(401).json({ error: 'Microsoft token verification failed' });
        }

        // Extract standard Microsoft claims
        const email = (decoded.email || decoded.preferred_username || '').toLowerCase().trim();
        const name = decoded.name || email.split('@')[0];

        if (!email) {
            return res.status(401).json({ error: 'No email claim in Microsoft token' });
        }

        // Enforce company domain restriction
        const domain = email.split('@')[1];
        if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
            return res.status(403).json({
                error: `Access denied. Only ${ALLOWED_DOMAINS.join(', ')} accounts are allowed.`,
            });
        }

        // Find or auto-create the user
        let user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                tokenVersion: true,
            },
        });

        if (!user) {
            const userCount = await prisma.user.count();

            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: '',      // No password — identity is managed by Microsoft
                    role: userCount === 0 ? 'HEAD_ADMIN' : 'USER',
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    department: true,
                    tokenVersion: true,
                },
            });

            console.log(`✅ Auto-provisioned new SSO user: ${email} (role: ${user.role})`);

            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE',
                    entityType: 'USER',
                    entityId: user.id,
                    details: 'User auto-provisioned via Microsoft SSO (first login)',
                },
            });
        }

        // Issue our own short-lived app JWT, embedding the current tokenVersion.
        // The middleware will reject this token if tokenVersion is ever bumped.
        const appToken = jwt.sign(
            { userId: user.id, tokenVersion: user.tokenVersion },
            JWT_SECRET,
            { expiresIn: '8h' }   // 8 hours — covers a full work day
        );

        // Return the user profile without the tokenVersion field
        const { tokenVersion: _tv, ...userProfile } = user;
        res.json({ user: userProfile, token: appToken });

    } catch (error) {
        console.error('SSO exchange error:', error);
        res.status(500).json({ error: 'SSO authentication failed' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me  — Get current user profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                phone: true,
                createdAt: true,
            },
        });

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/auth/profile  — Update profile (name, department, phone)
// ─────────────────────────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    department: z.string().max(100).optional(),
    // Accept common phone formats, strip leading/trailing whitespace
    phone: z
        .string()
        .max(30)
        .regex(/^[+\d\s\-().]*$/, 'Invalid phone number format')
        .optional(),
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateProfileSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                phone: true,
            },
        });

        res.json({ user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
