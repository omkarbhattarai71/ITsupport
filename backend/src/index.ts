import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import requestRoutes from './routes/requests';
import ticketRoutes from './routes/tickets';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Base endpoints
app.get('/', (req, res) => {
    res.json({ message: 'FCN IT Support Backend is running.' });
});

app.get('/api', (req, res) => {
    res.json({ message: 'FCN IT Support API is running. Access specific endpoints like /api/health' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔄 Reload triggered...`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
