'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/context/AuthContext';
import {
    Monitor,
    ArrowRight,
    Package,
    Headphones,
    Clock,
    Shield,
    Zap,
    CheckCircle,
} from 'lucide-react';

export default function HomePage() {
    const { user, loading } = useAuth();

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">FCN IT Support</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {loading ? (
                                <div className="w-24 h-10 skeleton rounded-lg" />
                            ) : user ? (
                                <Link
                                    href={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                                    className="btn btn-primary"
                                >
                                    Dashboard
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                                    className="btn btn-primary"
                                >
                                    Sign in with Microsoft
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-accent-900 -z-10" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 -z-10" />

                {/* Floating orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-[120px] opacity-30 animate-pulse-slow" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full blur-[150px] opacity-20 animate-pulse-slow" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/80 mb-8">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Streamlined IT Support for you
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Request IT Equipment
                            <br />
                            <span className="gradient-text">Fast & Simple</span>
                        </h1>

                        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12">
                            Browse our catalog of IT equipment, submit requests in seconds,
                            and track your orders all in one place. IT support made effortless.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                                className="btn btn-primary text-lg px-8 py-4"
                            >
                                Sign in with Microsoft
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <Link href="/catalog" className="btn btn-outline border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                                Browse Catalog
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Powerful features to manage your IT equipment requests
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Package,
                                title: 'Equipment Catalog',
                                description: 'Browse our extensive catalog of IT equipment including monitors, keyboards, cables, and more.',
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                icon: Headphones,
                                title: 'Support Tickets',
                                description: 'Create support tickets for any IT-related issues. Our team will assist you promptly.',
                                color: 'from-purple-500 to-pink-500',
                            },
                            {
                                icon: Clock,
                                title: 'Real-time Tracking',
                                description: 'Track your requests in real-time. Get notified when your items are ready for pickup.',
                                color: 'from-orange-500 to-red-500',
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="card card-hover p-8 animate-slide-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Get your IT equipment in just a few simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: '01', title: 'Browse', description: 'Explore our catalog of available equipment' },
                            { step: '02', title: 'Request', description: 'Select items and submit your request' },
                            { step: '03', title: 'Approval', description: 'IT team reviews and approves your request' },
                            { step: '04', title: 'Collect', description: 'Pick up your equipment from IT Support' },
                        ].map((item, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-accent-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-white/80 mb-8">
                        Join your colleagues and start managing your IT equipment requests today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                            className="btn bg-white text-primary-700 hover:bg-slate-100 text-lg px-8 py-4"
                        >
                            Sign in with Microsoft
                        </button>
                        <Link href="https://fcn.dk/" target="_blank" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">FCN IT Support</span>
                        </div>

                        <p className="text-slate-400 text-sm">
                            © {new Date().getFullYear()} FCN IT Support. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
