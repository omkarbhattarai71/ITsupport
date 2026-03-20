'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    ClipboardList,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    User,
    ChevronDown,
    ChevronUp,
    Loader2,
} from 'lucide-react';
import clsx from 'clsx';

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRequests();
    }, [filter, search]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminRequests({ status: filter, search });
            setRequests(data.requests);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setProcessing(id);
        try {
            await api.updateRequestStatus(id, { status, adminNotes: adminNotes[id] });
            fetchRequests();
            setExpandedId(null);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            PENDING: 'badge-pending',
            APPROVED: 'badge-approved',
            READY: 'badge-ready',
            COLLECTED: 'badge-collected',
            DECLINED: 'badge-declined',
            RETURNED: 'badge-returned',
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Requests Management</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Review and manage equipment requests
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user name or email..."
                        className="input pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['PENDING', 'APPROVED', 'READY', 'COLLECTED', 'DECLINED', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={clsx(
                                'btn',
                                filter === status ? 'btn-primary' : 'btn-secondary'
                            )}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests list */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-28 rounded-2xl" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 card">
                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No requests found</h3>
                    <p className="text-slate-500">
                        {filter === 'all' ? 'No requests in the system' : `No ${filter.toLowerCase()} requests`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="card overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center text-white font-medium">
                                        {request.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {request.user?.name}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {request.user?.email} • {request.user?.department || 'No dept'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {format(new Date(request.createdAt), 'MMM d, yyyy • h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${getPriorityBadge(request.priority)}`}>
                                        {request.priority}
                                    </span>
                                    <span className={`badge ${getStatusBadge(request.status)}`}>
                                        {request.status}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        {request.items?.length || 0} items
                                    </span>
                                    {expandedId === request.id ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </button>

                            {expandedId === request.id && (
                                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        {/* Items */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Requested Items</h4>
                                            <div className="space-y-2">
                                                {request.items?.map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="w-5 h-5 text-slate-400" />
                                                            <div>
                                                                <span className="font-medium text-slate-900 dark:text-white">
                                                                    {item.inventoryItem?.name}
                                                                </span>
                                                                <span className="text-xs text-slate-500 ml-2">
                                                                    (Stock: {item.inventoryItem?.quantity})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-slate-500">Qty: {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {request.notes && (
                                                <div className="mt-4">
                                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">User Notes</h4>
                                                    <p className="text-slate-600 dark:text-slate-400 p-3 bg-white dark:bg-slate-700 rounded-lg">
                                                        {request.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Admin Actions</h4>

                                            <div className="mb-4">
                                                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                    Admin Notes (optional)
                                                </label>
                                                <textarea
                                                    value={adminNotes[request.id] || ''}
                                                    onChange={(e) => setAdminNotes({ ...adminNotes, [request.id]: e.target.value })}
                                                    rows={3}
                                                    className="input"
                                                    placeholder="Add notes for the user..."
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {request.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(request.id, 'APPROVED')}
                                                            disabled={processing === request.id}
                                                            className="btn btn-success"
                                                        >
                                                            {processing === request.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(request.id, 'DECLINED')}
                                                            disabled={processing === request.id}
                                                            className="btn btn-danger"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Decline
                                                        </button>
                                                    </>
                                                )}

                                                {request.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => updateStatus(request.id, 'READY')}
                                                        disabled={processing === request.id}
                                                        className="btn btn-primary"
                                                    >
                                                        {processing === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Package className="w-4 h-4" />
                                                        )}
                                                        Mark Ready for Pickup
                                                    </button>
                                                )}

                                                {request.status === 'READY' && (
                                                    <button
                                                        onClick={() => updateStatus(request.id, 'COLLECTED')}
                                                        disabled={processing === request.id}
                                                        className="btn btn-primary"
                                                    >
                                                        {processing === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4" />
                                                        )}
                                                        Mark as Collected
                                                    </button>
                                                )}

                                                {request.status === 'COLLECTED' && (
                                                    <button
                                                        onClick={() => updateStatus(request.id, 'RETURNED')}
                                                        disabled={processing === request.id}
                                                        className="btn btn-secondary"
                                                    >
                                                        {processing === request.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Package className="w-4 h-4" />
                                                        )}
                                                        Mark as Returned
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
