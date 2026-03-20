'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    Headphones,
    Search,
    CheckCircle,
    Clock,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    XCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('OPEN');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [resolutions, setResolutions] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminTickets({ status: filter });
            setTickets(data.tickets);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setProcessing(id);
        try {
            await api.updateTicketStatus(id, { status, resolution: resolutions[id] });
            fetchTickets();
            setExpandedId(null);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            OPEN: 'badge-pending',
            IN_PROGRESS: 'badge-approved',
            WAITING_INFO: 'badge-pending',
            RESOLVED: 'badge-ready',
            CLOSED: 'badge-returned',
        };
        return badges[status] || 'badge-pending';
    };

    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, string> = {
            LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
            NORMAL: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        };
        return badges[priority] || '';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Tickets</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage and resolve support tickets
                </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['OPEN', 'IN_PROGRESS', 'WAITING_INFO', 'RESOLVED', 'CLOSED', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={clsx(
                            'btn',
                            filter === status ? 'btn-primary' : 'btn-secondary'
                        )}
                    >
                        {status === 'all' ? 'All' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Tickets list */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-28 rounded-2xl" />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 card">
                    <Headphones className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tickets found</h3>
                    <p className="text-slate-500">
                        {filter === 'all' ? 'No tickets in the system' : `No ${filter.toLowerCase().replace('_', ' ')} tickets`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {ticket.subject}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {ticket.user?.name} • {ticket.user?.email}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {format(new Date(ticket.createdAt), 'MMM d, yyyy • h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`badge ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    {expandedId === ticket.id ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </button>

                            {expandedId === ticket.id && (
                                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        {/* Description */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Description</h4>
                                            <p className="text-slate-600 dark:text-slate-400 p-4 bg-white dark:bg-slate-700 rounded-lg">
                                                {ticket.description}
                                            </p>

                                            {ticket.resolution && (
                                                <div className="mt-4">
                                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Previous Resolution</h4>
                                                    <p className="text-slate-600 dark:text-slate-400 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                        {ticket.resolution}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Actions</h4>

                                            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                                                <div className="mb-4">
                                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                        Resolution Notes
                                                    </label>
                                                    <textarea
                                                        value={resolutions[ticket.id] || ''}
                                                        onChange={(e) => setResolutions({ ...resolutions, [ticket.id]: e.target.value })}
                                                        rows={3}
                                                        className="input"
                                                        placeholder="Describe how the issue was resolved..."
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {ticket.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                                                        disabled={processing === ticket.id}
                                                        className="btn btn-primary"
                                                    >
                                                        {processing === ticket.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Clock className="w-4 h-4" />
                                                        )}
                                                        Start Working
                                                    </button>
                                                )}

                                                {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(ticket.id, 'WAITING_INFO')}
                                                            disabled={processing === ticket.id}
                                                            className="btn btn-secondary"
                                                        >
                                                            Request Info
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                                                            disabled={processing === ticket.id || !resolutions[ticket.id]}
                                                            className="btn btn-success"
                                                        >
                                                            {processing === ticket.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                            Resolve
                                                        </button>
                                                    </>
                                                )}

                                                {ticket.status === 'WAITING_INFO' && (
                                                    <button
                                                        onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                                                        disabled={processing === ticket.id}
                                                        className="btn btn-primary"
                                                    >
                                                        Resume Work
                                                    </button>
                                                )}

                                                {ticket.status === 'RESOLVED' && (
                                                    <button
                                                        onClick={() => updateStatus(ticket.id, 'CLOSED')}
                                                        disabled={processing === ticket.id}
                                                        className="btn btn-secondary"
                                                    >
                                                        Close Ticket
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
