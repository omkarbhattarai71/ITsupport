'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    Package,
    ClipboardList,
    Headphones,
    Clock,
    CheckCircle,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsData, ticketsData] = await Promise.all([
                    api.getRequests(),
                    api.getTickets(),
                ]);
                setRequests(requestsData.requests);
                setTickets(ticketsData.tickets);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
    const approvedRequests = requests.filter((r) => r.status === 'APPROVED' || r.status === 'READY').length;
    const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            PENDING: 'badge-pending',
            APPROVED: 'badge-approved',
            READY: 'badge-ready',
            COLLECTED: 'badge-collected',
            DECLINED: 'badge-declined',
            RETURNED: 'badge-returned',
            OPEN: 'badge-pending',
            IN_PROGRESS: 'badge-approved',
            RESOLVED: 'badge-ready',
            CLOSED: 'badge-returned',
        };
        return badges[status] || 'badge-pending';
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="skeleton h-12 w-64 rounded-lg" />
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Here's what's happening with your IT requests
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Pending Requests</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{pendingRequests}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ready to Collect</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{approvedRequests}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Open Tickets</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{openTickets}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <Link href="/dashboard/catalog" className="card card-hover p-6 group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                            <Package className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Request Equipment</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Browse catalog and request IT equipment
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </Link>

                <Link href="/dashboard/support" className="card card-hover p-6 group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Headphones className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Support Ticket</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Get help from IT support team
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Requests */}
                <div className="card">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Requests</h2>
                        <Link href="/dashboard/requests" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requests.slice(0, 4).map((request) => (
                            <div key={request.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {request.items?.length || 0} item{request.items?.length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <span className={`badge ${getStatusBadge(request.status)}`}>
                                    {request.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <p className="p-6 text-center text-slate-500">No requests yet</p>
                        )}
                    </div>
                </div>

                {/* Recent Tickets */}
                <div className="card">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Tickets</h2>
                        <Link href="/dashboard/support" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tickets.slice(0, 4).map((ticket) => (
                            <div key={ticket.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                        {ticket.subject}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <span className={`badge ${getStatusBadge(ticket.status)}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <p className="p-6 text-center text-slate-500">No tickets yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
