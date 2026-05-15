/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'fcnadmin-omk@fcn.dk';
    console.log(`Setting up HEAD_ADMIN for ${email}...`);

    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        user = await prisma.user.update({
            where: { email },
            data: { role: 'HEAD_ADMIN' },
        });
        console.log(`✅ Existing user updated to HEAD_ADMIN: ${user.email}`);
    } else {
        user = await prisma.user.create({
            data: {
                email,
                name: 'System Administrator',
                password: '', // Managed by SSO
                role: 'HEAD_ADMIN',
            },
        });
        console.log(`✅ New user created as HEAD_ADMIN: ${user.email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
