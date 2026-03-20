import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        const { category, search, active } = req.query;

        const where: any = {};

        if (category) {
            where.category = category as string;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { description: { contains: search as string } },
            ];
        }

        if (active !== 'all') {
            where.isActive = true;
        }

        const items = await prisma.inventoryItem.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        // Get unique categories
        const categories = await prisma.inventoryItem.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        res.json({
            items,
            categories: categories.map((c) => c.category),
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Get single inventory item
router.get('/:id', async (req, res) => {
    try {
        const item = await prisma.inventoryItem.findUnique({
            where: { id: req.params.id },
        });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ item });
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Create inventory item (admin only)
const createItemSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    category: z.string().min(2),
    quantity: z.number().int().min(0),
    imageUrl: z.string().optional(),
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createItemSchema.parse(req.body);

        const item = await prisma.inventoryItem.create({
            data,
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'CREATE',
                entityType: 'INVENTORY',
                entityId: item.id,
                details: `Created inventory item: ${item.name}`,
            },
        });

        res.status(201).json({ item });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Update inventory item (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createItemSchema.partial().parse(req.body);

        const item = await prisma.inventoryItem.update({
            where: { id: req.params.id },
            data,
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'UPDATE',
                entityType: 'INVENTORY',
                entityId: item.id,
                details: `Updated inventory item: ${item.name}`,
            },
        });

        res.json({ item });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete inventory item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const item = await prisma.inventoryItem.delete({
            where: { id: req.params.id },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user!.id,
                action: 'DELETE',
                entityType: 'INVENTORY',
                entityId: item.id,
                details: `Deleted inventory item: ${item.name}`,
            },
        });

        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;
