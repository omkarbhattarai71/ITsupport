import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Create support ticket
const createTicketSchema = z.object({
    subject: z.string().min(5),
    description: z.string().min(10),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTicketSchema.parse(req.body);

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: req.user!.id,
                subject: data.subject,
                description: data.description,
                priority: data.priority || 'NORMAL',
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        // Create notification for admins
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
        });

        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: 'New Support Ticket',
                    message: `${req.user!.name}: ${data.subject}`,
                    type: 'REQUEST_RECEIVED',
                    link: '/admin/tickets',
                },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'TICKET',
                entityId: ticket.id,
                details: `Created support ticket: ${data.subject}`,
            },
        });

        res.status(201).json({ ticket });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// Get user's tickets
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = { userId: req.user!.id };
        if (status && status !== 'all') {
            where.status = status as string;
        }

        const tickets = await prisma.supportTicket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({ tickets });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Get single ticket
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, department: true },
                },
            },
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Check if user owns the ticket or is admin
        if (ticket.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ ticket });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
});

export default router;
