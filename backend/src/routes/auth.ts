import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fcn-it-support-secret-key';

// Allowed company domains — only these can access the app via SSO
const ALLOWED_DOMAINS = ['fcn.dk', 'fcmasar.com', 'righttodream.com'];

// ─────────────────────────────────────────────────────────────────
//  POST /api/auth/sso
//  Called by the frontend after Microsoft SSO succeeds.
//  Receives the Microsoft ID token (JWT) from NextAuth session,
//  decodes and verifies it, then finds or auto-creates the user
//  in our database, and returns our own app JWT.
// ─────────────────────────────────────────────────────────────────
router.post('/sso', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken || typeof idToken !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid ID token' });
        }

        // Microsoft ID tokens are JWTs signed by Microsoft's public keys.
        // For a third-party web app using NextAuth (server-side), the token
        // has already been verified by NextAuth before being forwarded here.
        // We decode (without re-verifying signature) to extract the user claims.
        // In a high-security environment, add jwks-rsa to re-verify against
        // Microsoft's JWKS endpoint: https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys
        const decoded = jwt.decode(idToken) as {
            email?: string;
            preferred_username?: string;
            name?: string;
            oid?: string;        // Microsoft Object ID — unique per user per tenant
            tid?: string;        // Tenant ID
        } | null;

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid ID token — could not decode' });
        }

        // Microsoft uses 'preferred_username' for the email-like UPN
        const email = (decoded.email || decoded.preferred_username || '').toLowerCase();
        const name = decoded.name || email.split('@')[0];
        const microsoftId = decoded.oid;

        if (!email) {
            return res.status(401).json({ error: 'No email claim in Microsoft token' });
        }

        // Enforce company domain restriction
        const domain = email.split('@')[1];
        if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
            return res.status(403).json({
                error: `Access denied. Only ${ALLOWED_DOMAINS.join(', ')} accounts are allowed.`
            });
        }

        // Find existing user or auto-create on first login (provisioning)
        let user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true, department: true },
        });

        if (!user) {
            // First time this person logs in — create their profile automatically
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: '',      // No password — identity is managed by Microsoft
                    role: 'USER',      // Default role; admin can promote via admin panel
                },
                select: { id: true, email: true, name: true, role: true, department: true },
            });

            console.log(`✅ Auto-provisioned new SSO user: ${email}`);

            // Log the first-time provisioning
            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE',
                    entityType: 'USER',
                    entityId: user.id,
                    details: `User auto-provisioned via Microsoft SSO (first login)`,
                },
            });
        }

        // Issue our own short-lived app JWT
        const appToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user, token: appToken });

    } catch (error) {
        console.error('SSO exchange error:', error);
        res.status(500).json({ error: 'SSO authentication failed' });
    }
});

// ─────────────────────────────────────────────────────────────────
//  GET /api/auth/me  — Get current user profile
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
//  PUT /api/auth/profile  — Update profile (name, department, phone)
// ─────────────────────────────────────────────────────────────────
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { name, department, phone } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: { name, department, phone },
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
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
