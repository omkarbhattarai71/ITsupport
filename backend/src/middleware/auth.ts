import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// ─────────────────────────────────────────────────────────────────────────────
//  The JWT_SECRET existence is already guaranteed by the startup guard in index.ts.
//  The non-null assertion is therefore safe at runtime.
// ─────────────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  authenticateToken
//
//  1. Verifies the JWT signature and expiry.
//  2. Fetches the live user record from the DB to confirm they still exist.
//  3. Checks the tokenVersion embedded in the JWT against the current DB value.
//     If an admin changed the user's role or revoked their session, the
//     tokenVersion is incremented in the DB — any older tokens are rejected here.
// ─────────────────────────────────────────────────────────────────────────────
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            tokenVersion?: number;
        };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                tokenVersion: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Token version check — rejects tokens issued before a role change
        // or a forced logout. Old tokens without tokenVersion default to 0.
        const tokenVersion = decoded.tokenVersion ?? 0;
        if (user.tokenVersion !== tokenVersion) {
            return res.status(401).json({ error: 'Session has been invalidated. Please log in again.' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };
        next();
    } catch (error) {
        // jwt.verify throws TokenExpiredError, JsonWebTokenError, etc.
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  requireAdmin — gate for ADMIN and HEAD_ADMIN roles
// ─────────────────────────────────────────────────────────────────────────────
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'HEAD_ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
