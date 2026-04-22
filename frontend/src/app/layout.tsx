import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/context/NextAuthProvider';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'FCN IT Support - Equipment Booking & Asset Management',
    description: 'Request IT equipment and services, manage assets, and track your support tickets',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                {/* NextAuthProvider must wrap everything so useSession() works */}
                <NextAuthProvider>
                    <AuthProvider>
                        <NotificationProvider>
                            {children}
                        </NotificationProvider>
                    </AuthProvider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
