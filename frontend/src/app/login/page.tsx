
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Monitor, Loader2, ShieldCheck, Users, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // If already authenticated via NextAuth, redirect to dashboard
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    const handleMicrosoftSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signIn('azure-ad', {
                callbackUrl: '/dashboard',
                redirect: true,
            });
        } catch (err) {
            setError('Sign-in failed. Please try again.');
            setIsLoading(false);
        }
    };

    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-accent-900">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-800 via-primary-900 to-accent-900 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-pulse" />

                <div className="relative text-center text-white max-w-lg">
                    <div className="w-20 h-20 mx-auto mb-8 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">FCN IT Support</h2>
                    <p className="text-xl text-white/70 mb-10">
                        Request IT equipment, submit tickets, and track your orders — all in one place.
                    </p>

                    <div className="space-y-4 text-left">
                        {[
                            { icon: ShieldCheck, text: 'Secured by Microsoft Entra ID (Azure AD)' },
                            { icon: Users, text: 'Available to all FCN company employees' },
                            { icon: Zap, text: 'Sign in with your existing company account' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3 text-white/80">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Sign in */}
            <div className="flex-1 flex flex-col p-8 bg-white dark:bg-slate-950 relative">
                {/* Back to Home Button */}
                <div className="absolute top-8 left-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-sm animate-fade-in mt-12 lg:mt-0">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">FCN IT Support</span>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Welcome
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-10">
                            Sign in with your company Microsoft account.
                            <br />
                            No separate registration required.
                        </p>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Microsoft Sign In Button */}
                        <button
                            id="microsoft-signin-btn"
                            onClick={handleMicrosoftSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                /* Microsoft logo SVG */
                                <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                </svg>
                            )}
                            {isLoading ? 'Redirecting to Microsoft...' : 'Sign in with Microsoft'}
                        </button>

                        <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                Your sign-in is handled by <strong>Microsoft Entra ID</strong>.
                                FCN IT Support never stores your password.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
