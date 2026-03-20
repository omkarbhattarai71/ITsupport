'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    Headphones,
    Plus,
    X,
    Send,
    Loader2,
    MessageCircle,
    Clock,
    CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function SupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'NORMAL',
    });

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    const fetchTickets = async () => {
        try {
            const data = await api.getTickets(filter);
            setTickets(data.tickets);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await api.createTicket(formData);
            setFormData({ subject: '', description: '', priority: 'NORMAL' });
            setShowForm(false);
            fetchTickets();
        } catch (err: any) {
            console.error('Failed to create ticket:', err);
            setError(err.message || 'Failed to create ticket. Please check your inputs.');
        } finally {
            setSubmitting(false);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">IT Support</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Create and manage support tickets
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    New Ticket
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={clsx(
                            'btn',
                            filter === status ? 'btn-primary' : 'btn-secondary'
                        )}
                    >
                        {status === 'all' ? 'All Tickets' : status.replace('_', ' ')}
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
                    <p className="text-slate-500 mb-4">
                        {filter === 'all' ? "You haven't created any support tickets yet" : `No ${filter.toLowerCase()} tickets`}
                    </p>
                    <button onClick={() => setShowForm(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Create Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mt-1">
                                        <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {format(new Date(ticket.createdAt), 'MMMM d, yyyy • h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`badge ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                {ticket.description}
                            </p>

                            {ticket.resolution && (
                                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Resolution</p>
                                    <p className="text-emerald-600 dark:text-emerald-400">{ticket.resolution}</p>
                                </div>
                            )}

                            {ticket.status === 'WAITING_INFO' && (
                                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        IT Support is waiting for more information from you
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* New ticket modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Support Ticket</h2>
                            <button onClick={() => setShowForm(false)} className="btn btn-ghost p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="input"
                                    placeholder="Brief description of your issue (min 5 characters)"
                                    minLength={5}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="input"
                                >
                                    <option value="LOW">Low - General inquiry</option>
                                    <option value="NORMAL">Normal - Standard issue</option>
                                    <option value="HIGH">High - Impacting work</option>
                                    <option value="URGENT">Urgent - Critical blocker</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    className="input"
                                    placeholder="Please describe your issue in detail... (min 10 characters)"
                                    minLength={10}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
