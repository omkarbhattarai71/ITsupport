import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  Multer configuration for inventory image uploads
//  - Max 10 MB
//  - Only jpeg, png, webp, gif
//  - Saved to uploads/inventory/ with unique filenames
// ─────────────────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'inventory');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `inv-${uniqueSuffix}${ext}`);
    },
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: imageFilter,
});

/**
 * Helper to delete an old image file from disk
 */
function deleteImageFile(imageUrl: string | null | undefined) {
    if (!imageUrl || !imageUrl.startsWith('/uploads/inventory/')) return;
    const filePath = path.join(__dirname, '..', '..', imageUrl);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.warn('Failed to delete old image:', err);
    }
}

// Get all inventory items (authenticated users only)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
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

// Get single inventory item (authenticated users only)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
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

// Create inventory item (admin only) — supports image upload
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
        // Parse form fields (multer puts them in req.body as strings)
        const name = req.body.name;
        const description = req.body.description || undefined;
        const category = req.body.category;
        const quantity = parseInt(req.body.quantity, 10);
        const imageUrl = req.file ? `/uploads/inventory/${req.file.filename}` : (req.body.imageUrl || undefined);

        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }
        if (!category || category.length < 2) {
            return res.status(400).json({ error: 'Category must be at least 2 characters' });
        }
        if (isNaN(quantity) || quantity < 0) {
            return res.status(400).json({ error: 'Quantity must be a non-negative number' });
        }

        const item = await prisma.inventoryItem.create({
            data: {
                name,
                description,
                category,
                quantity,
                imageUrl,
            },
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
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Update inventory item (admin only) — supports image upload
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.inventoryItem.findUnique({
            where: { id: req.params.id },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const data: any = {};

        if (req.body.name !== undefined) data.name = req.body.name;
        if (req.body.description !== undefined) data.description = req.body.description;
        if (req.body.category !== undefined) data.category = req.body.category;
        if (req.body.quantity !== undefined) data.quantity = parseInt(req.body.quantity, 10);

        // Handle image: new upload replaces old, explicit empty string removes image
        if (req.file) {
            deleteImageFile(existing.imageUrl);
            data.imageUrl = `/uploads/inventory/${req.file.filename}`;
        } else if (req.body.removeImage === 'true') {
            deleteImageFile(existing.imageUrl);
            data.imageUrl = null;
        }

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
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete inventory item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const item = await prisma.inventoryItem.findUnique({
            where: { id: req.params.id },
        });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Delete image file if exists
        deleteImageFile(item.imageUrl);

        await prisma.inventoryItem.delete({
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
