import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'fcnadmin-omk@fcn.dk';
    console.log(`Setting up HEAD ADMIN for ${email}...`);

    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        user = await prisma.user.update({
            where: { email },
            data: { role: 'HEAD ADMIN' },
        });
        console.log(`✅ Existing user updated to HEAD ADMIN: ${user.email}`);
    } else {
        user = await prisma.user.create({
            data: {
                email,
                name: 'System Administrator',
                password: '', // Managed by SSO
                role: 'HEAD ADMIN',
            },
        });
        console.log(`✅ New user created as HEAD ADMIN: ${user.email}`);
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
