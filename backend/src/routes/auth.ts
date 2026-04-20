import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendPasswordEmail } from '../utils/email';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fcn-it-support-secret-key';

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    department: z.string().optional(),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        const allowedDomains = ['fcn.dk', 'fcmasar.com', 'righttodream.com'];
        const domain = data.email.split('@')[1].toLowerCase();
        if (!allowedDomains.includes(domain)) {
            return res.status(400).json({ error: `Invalid email domain. Allowed domains are: ${allowedDomains.join(', ')}` });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate secure random password
        const generatedPassword = crypto.randomBytes(6).toString('hex');

        // Send welcome email with password
        const emailSent = await sendPasswordEmail(data.email, generatedPassword);
        
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send credentials email. Please contact support or check server SMTP settings.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                department: data.department,
                phone: data.phone,
                role: 'USER',
            },
            select: { id: true, email: true, name: true, role: true },
        });

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'CREATE',
                entityType: 'USER',
                entityId: user.id,
                details: 'User registered via email OTP flow',
            },
        });

        res.status(201).json({ user, token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
            },
            token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
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

// Update profile
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
