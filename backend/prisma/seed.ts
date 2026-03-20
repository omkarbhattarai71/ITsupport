/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import console from 'console';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@fcn.com' },
        update: {},
        create: {
            email: 'admin@fcn.com',
            password: adminPassword,
            name: 'IT Admin',
            role: 'ADMIN',
            department: 'IT Support',
        },
    });
    console.log('✅ Created admin user:', admin.email);

    // Create test user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'user@fcn.com' },
        update: {},
        create: {
            email: 'user@fcn.com',
            password: userPassword,
            name: 'John Doe',
            role: 'USER',
            department: 'Engineering',
        },
    });
    console.log('✅ Created test user:', user.email);

    // Create inventory items
    const inventoryItems = [
        {
            name: 'Docking Station',
            description: 'USB-C Docking Station with dual monitor support, USB 3.0 ports, and ethernet',
            category: 'Accessories',
            quantity: 25,
            imageUrl: '/images/dock-station.png',
        },
        {
            name: 'HDMI Cable (2m)',
            description: 'High-speed HDMI 2.1 cable, 2 meters length',
            category: 'Cables',
            quantity: 50,
            imageUrl: '/images/hdmi-cable.png',
        },
        {
            name: 'USB-C Cable (1m)',
            description: 'USB-C to USB-C cable, 1 meter, supports fast charging',
            category: 'Cables',
            quantity: 75,
            imageUrl: '/images/usbc-cable.png',
        },
        {
            name: 'Laptop Charger (65W)',
            description: 'Universal 65W USB-C laptop charger',
            category: 'Power',
            quantity: 30,
            imageUrl: '/images/charger.png',
        },
        {
            name: 'Laptop Charger (100W)',
            description: 'High-power 100W USB-C laptop charger for gaming laptops',
            category: 'Power',
            quantity: 15,
            imageUrl: '/images/charger-100w.png',
        },
        {
            name: 'Wireless Mouse',
            description: 'Ergonomic wireless mouse with USB receiver',
            category: 'Peripherals',
            quantity: 40,
            imageUrl: '/images/mouse.png',
        },
        {
            name: 'Wireless Keyboard',
            description: 'Compact wireless keyboard with numeric pad',
            category: 'Peripherals',
            quantity: 35,
            imageUrl: '/images/keyboard.png',
        },
        {
            name: 'Monitor 24"',
            description: '24-inch Full HD IPS monitor, HDMI and DisplayPort',
            category: 'Displays',
            quantity: 20,
            imageUrl: '/images/monitor-24.png',
        },
        {
            name: 'Monitor 27" 4K',
            description: '27-inch 4K UHD IPS monitor, USB-C with power delivery',
            category: 'Displays',
            quantity: 10,
            imageUrl: '/images/monitor-27.png',
        },
        {
            name: 'Laptop Stand',
            description: 'Adjustable aluminum laptop stand',
            category: 'Accessories',
            quantity: 45,
            imageUrl: '/images/laptop-stand.png',
        },
        {
            name: 'Webcam HD',
            description: '1080p HD webcam with built-in microphone',
            category: 'Peripherals',
            quantity: 30,
            imageUrl: '/images/webcam.png',
        },
        {
            name: 'Headset',
            description: 'Over-ear headset with noise cancellation and microphone',
            category: 'Audio',
            quantity: 25,
            imageUrl: '/images/headset.png',
        },
        {
            name: 'USB Hub (4-port)',
            description: 'USB 3.0 4-port hub with power adapter',
            category: 'Accessories',
            quantity: 40,
            imageUrl: '/images/usb-hub.png',
        },
        {
            name: 'Ethernet Adapter',
            description: 'USB-C to Gigabit Ethernet adapter',
            category: 'Networking',
            quantity: 35,
            imageUrl: '/images/ethernet-adapter.png',
        },
        {
            name: 'DisplayPort Cable (2m)',
            description: 'DisplayPort 1.4 cable, 2 meters',
            category: 'Cables',
            quantity: 30,
            imageUrl: '/images/dp-cable.png',
        },
    ];

    for (const item of inventoryItems) {
        await prisma.inventoryItem.upsert({
            where: { id: item.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
            update: item,
            create: {
                id: item.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                ...item,
            },
        });
    }
    console.log('✅ Created', inventoryItems.length, 'inventory items');

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
