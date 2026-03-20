import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Create item request
const createRequestSchema = z.object({
    items: z.array(z.object({
        inventoryItemId: z.string(),
        quantity: z.number().int().min(1),
    })).min(1),
    notes: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const data = createRequestSchema.parse(req.body);

        // Create request with items
        const request = await prisma.itemRequest.create({
            data: {
                userId: req.user!.id,
                notes: data.notes,
                priority: data.priority || 'NORMAL',
                items: {
                    create: data.items.map((item) => ({
                        inventoryItemId: item.inventoryItemId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
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
                    title: 'New Item Request',
                    message: `${req.user!.name} has submitted a new item request`,
                    type: 'REQUEST_RECEIVED',
                    link: '/admin/requests',
                },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'REQUEST',
                entityId: request.id,
                details: `Created item request with ${data.items.length} items`,
            },
        });

        res.status(201).json({ request });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// Get user's requests
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = { userId: req.user!.id };
        if (status && status !== 'all') {
            where.status = status as string;
        }

        const requests = await prisma.itemRequest.findMany({
            where,
            include: {
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ requests });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Get single request
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const request = await prisma.itemRequest.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
                user: {
                    select: { id: true, name: true, email: true, department: true },
                },
            },
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Check if user owns the request or is admin
        if (request.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ request });
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

// Cancel request (user can cancel their own pending requests)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const request = await prisma.itemRequest.findUnique({
            where: { id: req.params.id },
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.userId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Can only cancel pending requests' });
        }

        await prisma.itemRequest.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'Request cancelled' });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ error: 'Failed to cancel request' });
    }
});

export default router;
