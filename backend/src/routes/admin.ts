import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [
            pendingRequests,
            approvedRequests,
            totalRequests,
            openTickets,
            totalTickets,
            totalUsers,
            lowStockItems,
        ] = await Promise.all([
            prisma.itemRequest.count({ where: { status: 'PENDING' } }),
            prisma.itemRequest.count({ where: { status: 'APPROVED' } }),
            prisma.itemRequest.count(),
            prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            prisma.supportTicket.count(),
            prisma.user.count({ where: { role: 'USER' } }),
            prisma.inventoryItem.count({ where: { quantity: { lt: 5 } } }),
        ]);

        // Recent activity
        const recentActivity = await prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        // Most requested items (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topItems = await prisma.requestItem.groupBy({
            by: ['inventoryItemId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        const topItemsWithDetails = await Promise.all(
            topItems.map(async (item) => {
                const inventoryItem = await prisma.inventoryItem.findUnique({
                    where: { id: item.inventoryItemId },
                });
                return {
                    ...inventoryItem,
                    requestCount: item._sum.quantity,
                };
            })
        );

        res.json({
            stats: {
                pendingRequests,
                approvedRequests,
                totalRequests,
                openTickets,
                totalTickets,
                totalUsers,
                lowStockItems,
            },
            recentActivity,
            topItems: topItemsWithDetails,
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all requests (admin)
router.get('/requests', async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority, search } = req.query;

        const where: any = {};
        if (status && status !== 'all') {
            where.status = status as string;
        }
        if (priority && priority !== 'all') {
            where.priority = priority as string;
        }
        if (search) {
            where.OR = [
                { user: { name: { contains: search as string } } },
                { user: { email: { contains: search as string } } },
                { notes: { contains: search as string } },
            ];
        }

        const requests = await prisma.itemRequest.findMany({
            where,
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
            orderBy: { createdAt: 'desc' },
        });

        res.json({ requests });
    } catch (error) {
        console.error('Get admin requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Update request status
const updateStatusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'DECLINED', 'READY', 'COLLECTED', 'RETURNED']),
    adminNotes: z.string().optional(),
});

router.put('/requests/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateStatusSchema.parse(req.body);

        const existingRequest = await prisma.itemRequest.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, name: true } },
                items: { include: { inventoryItem: true } },
            },
        });

        if (!existingRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const updateData: any = {
            status: data.status,
            adminNotes: data.adminNotes,
            approvedBy: req.user!.id,
        };

        // Set timestamps based on status
        if (data.status === 'APPROVED') updateData.approvedAt = new Date();
        if (data.status === 'COLLECTED') updateData.collectedAt = new Date();
        if (data.status === 'RETURNED') updateData.returnedAt = new Date();

        // Update inventory quantities on collection
        if (data.status === 'COLLECTED') {
            for (const item of existingRequest.items) {
                await prisma.inventoryItem.update({
                    where: { id: item.inventoryItemId },
                    data: { quantity: { decrement: item.quantity } },
                });
            }
        }

        // Restore inventory on return
        if (data.status === 'RETURNED') {
            for (const item of existingRequest.items) {
                await prisma.inventoryItem.update({
                    where: { id: item.inventoryItemId },
                    data: { quantity: { increment: item.quantity } },
                });
            }
        }

        const request = await prisma.itemRequest.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                items: { include: { inventoryItem: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // Send notification to user
        const notificationMessages: Record<string, { title: string; message: string; type: string }> = {
            APPROVED: {
                title: 'Request Approved',
                message: 'Your item request has been approved',
                type: 'REQUEST_APPROVED',
            },
            DECLINED: {
                title: 'Request Declined',
                message: `Your request was declined. ${data.adminNotes || ''}`,
                type: 'REQUEST_DECLINED',
            },
            READY: {
                title: 'Items Ready for Collection',
                message: 'Your requested items are ready to collect from IT Support',
                type: 'READY_TO_COLLECT',
            },
        };

        if (notificationMessages[data.status]) {
            await prisma.notification.create({
                data: {
                    userId: existingRequest.userId,
                    ...notificationMessages[data.status],
                    link: '/dashboard/requests',
                },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: data.status,
                entityType: 'REQUEST',
                entityId: request.id,
                details: `Updated request status to ${data.status}`,
            },
        });

        res.json({ request });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update request status error:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Get all tickets (admin)
router.get('/tickets', async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority } = req.query;

        const where: any = {};
        if (status && status !== 'all') {
            where.status = status as string;
        }
        if (priority && priority !== 'all') {
            where.priority = priority as string;
        }

        const tickets = await prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, department: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ tickets });
    } catch (error) {
        console.error('Get admin tickets error:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Update ticket status
const updateTicketSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_INFO', 'RESOLVED', 'CLOSED']),
    resolution: z.string().optional(),
    assignedTo: z.string().optional(),
});

router.put('/tickets/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const data = updateTicketSchema.parse(req.body);

        const existingTicket = await prisma.supportTicket.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { id: true, name: true } } },
        });

        if (!existingTicket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const updateData: any = {
            status: data.status,
            resolution: data.resolution,
            assignedTo: data.assignedTo || req.user!.id,
        };

        if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
            updateData.resolvedAt = new Date();
        }

        const ticket = await prisma.supportTicket.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // Send notification
        await prisma.notification.create({
            data: {
                userId: existingTicket.userId,
                title: 'Ticket Update',
                message: `Your ticket "${existingTicket.subject}" status: ${data.status}`,
                type: 'TICKET_UPDATE',
                link: '/dashboard/support',
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'TICKET',
                entityId: ticket.id,
                details: `Updated ticket status to ${data.status}`,
            },
        });

        res.json({ ticket });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update ticket status error:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// Get activity logs
router.get('/logs', async (req: AuthRequest, res: Response) => {
    try {
        const { entityType, action, limit } = req.query;

        const where: any = {};
        if (entityType) where.entityType = entityType as string;
        if (action) where.action = action as string;

        const logs = await prisma.activityLog.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit as string) : 100,
        });

        res.json({ logs });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Get all users (admin)
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
                createdAt: true,
                _count: {
                    select: {
                        requests: true,
                        tickets: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Send notification to user
router.post('/notifications', async (req: AuthRequest, res: Response) => {
    try {
        const { userId, title, message, type, link } = req.body;

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'INFO_REQUIRED',
                link,
            },
        });

        res.status(201).json({ notification });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});
// Delete user (admin only)
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.id;

        if (userId === req.user!.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Step 1: Find all ItemRequest IDs for this user
        const userRequests = await prisma.itemRequest.findMany({
            where: { userId },
            select: { id: true },
        });
        const requestIds = userRequests.map((r) => r.id);

        // Step 2: Delete RequestItems (children of ItemRequest) first to avoid FK violation
        if (requestIds.length > 0) {
            await prisma.requestItem.deleteMany({
                where: { requestId: { in: requestIds } },
            });
        }

        // Step 3: Delete ItemRequests
        await prisma.itemRequest.deleteMany({ where: { userId } });

        // Step 4: Delete SupportTickets
        await prisma.supportTicket.deleteMany({ where: { userId } });

        // Step 5: Delete Notifications
        await prisma.notification.deleteMany({ where: { userId } });

        // Step 6: Nullify ActivityLog userId (preserve audit history)
        await prisma.activityLog.updateMany({
            where: { userId },
            data: { userId: null },
        });

        // Step 7: Delete the user
        await prisma.user.delete({ where: { id: userId } });

        // Step 8: Log this admin action
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'USER',
                entityId: userId,
                details: `Admin deleted user account: ${user.name} (${user.email})`,
            },
        });

        res.json({ message: `User "${user.name}" deleted successfully` });
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error?.message || 'Failed to delete user' });
    }
});

export default router;
