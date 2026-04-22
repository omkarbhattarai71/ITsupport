'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

// This page is no longer used — SSO replaces manual registration.
// Any old bookmarks to /register are redirected to login.
export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Immediately trigger Microsoft SSO instead
        signIn('azure-ad', { callbackUrl: '/dashboard' });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-primary-900">
            <p className="text-white/60 text-sm">Redirecting to Microsoft login...</p>
        </div>
    );
}
