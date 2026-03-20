'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useState } from 'react';
import {
    Monitor,
    LayoutDashboard,
    Package,
    ClipboardList,
    Headphones,
    Bell,
    User,
    LogOut,
    Menu,
    X,
    ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Catalog', href: '/dashboard/catalog', icon: Package },
    { name: 'My Requests', href: '/dashboard/requests', icon: ClipboardList },
    { name: 'Support', href: '/dashboard/support', icon: Headphones },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const { unreadCount, notifications, markAsRead } = useNotifications();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Redirect to login if not authenticated
    if (!loading && !user) {
        router.push('/login');
        return null;
    }

    // Redirect admin to admin dashboard
    if (!loading && user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text hidden sm:block">FCN IT Support</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                        pathname === item.href
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setNotificationOpen(!notificationOpen);
                                        setProfileOpen(false);
                                    }}
                                    className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notificationOpen && (
                                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {notifications.length === 0 ? (
                                                <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                                            ) : (
                                                notifications.slice(0, 5).map((notification) => (
                                                    <button
                                                        key={notification.id}
                                                        onClick={() => {
                                                            markAsRead(notification.id);
                                                            if (notification.link) {
                                                                router.push(notification.link);
                                                            }
                                                            setNotificationOpen(false);
                                                        }}
                                                        className={clsx(
                                                            'w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700',
                                                            !notification.read && 'bg-primary-50 dark:bg-primary-900/20'
                                                        )}
                                                    >
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                                            {notification.message}
                                                        </p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setProfileOpen(!profileOpen);
                                        setNotificationOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center text-white font-medium">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {user?.name}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                            <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
                                            <p className="text-sm text-slate-500">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/dashboard/profile"
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                <User className="w-4 h-4" />
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="p-4 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={clsx(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                                        pathname === item.href
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="pt-16 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
