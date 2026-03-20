'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    ClipboardList,
    Headphones,
    Package,
    Users,
    AlertTriangle,
    TrendingUp,
    Clock,
    ArrowRight,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getAdminStats();
                setStats(data.stats);
                setRecentActivity(data.recentActivity);
                setTopItems(data.topItems);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="skeleton h-12 w-64 rounded-lg" />
                <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Pending Requests',
            value: stats?.pendingRequests || 0,
            icon: ClipboardList,
            color: 'from-yellow-500 to-orange-500',
            link: '/admin/requests?status=PENDING',
        },
        {
            label: 'Open Tickets',
            value: stats?.openTickets || 0,
            icon: Headphones,
            color: 'from-blue-500 to-cyan-500',
            link: '/admin/tickets?status=OPEN',
        },
        {
            label: 'Low Stock Items',
            value: stats?.lowStockItems || 0,
            icon: AlertTriangle,
            color: 'from-red-500 to-pink-500',
            link: '/admin/inventory',
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'from-purple-500 to-indigo-500',
            link: '/admin/users',
        },
    ];

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE':
                return <ArrowUp className="w-4 h-4 text-emerald-500" />;
            case 'DELETE':
                return <ArrowDown className="w-4 h-4 text-red-500" />;
            default:
                return <TrendingUp className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Overview of IT support operations
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        href={stat.link}
                        className="card card-hover p-6 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Request Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Total Requests</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{stats?.totalRequests || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Approved Today</span>
                            <span className="font-semibold text-emerald-600">{stats?.approvedRequests || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Pending</span>
                            <span className="font-semibold text-yellow-600">{stats?.pendingRequests || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ticket Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Total Tickets</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{stats?.totalTickets || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Open</span>
                            <span className="font-semibold text-blue-600">{stats?.openTickets || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Link href="/admin/requests" className="btn btn-primary w-full justify-center">
                            Review Requests
                        </Link>
                        <Link href="/admin/inventory" className="btn btn-secondary w-full justify-center">
                            Manage Inventory
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="card">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                        <Link href="/admin/logs" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentActivity.slice(0, 6).map((activity) => (
                            <div key={activity.id} className="p-4 flex items-center gap-3">
                                {getActionIcon(activity.action)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900 dark:text-white truncate">
                                        {activity.details || `${activity.action} ${activity.entityType}`}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {activity.user?.name || 'System'} • {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="p-6 text-center text-slate-500">No recent activity</p>
                        )}
                    </div>
                </div>

                {/* Top Requested Items */}
                <div className="card">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Most Requested Items</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {topItems.slice(0, 5).map((item, index) => (
                            <div key={item?.id || index} className="p-4 flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                        {item?.name || 'Unknown Item'}
                                    </p>
                                    <p className="text-xs text-slate-500">{item?.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-slate-900 dark:text-white">{item?.requestCount || 0}</p>
                                    <p className="text-xs text-slate-500">requests</p>
                                </div>
                            </div>
                        ))}
                        {topItems.length === 0 && (
                            <p className="p-6 text-center text-slate-500">No data yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
