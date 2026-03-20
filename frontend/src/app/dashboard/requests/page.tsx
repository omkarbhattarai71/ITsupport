'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    ClipboardList,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    ChevronDown,
    ChevronUp,
    Filter,
} from 'lucide-react';
import clsx from 'clsx';

export default function RequestsPage() {
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const showSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await api.getRequests(filter);
                setRequests(data.requests);
            } catch (error) {
                console.error('Failed to fetch requests:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [filter]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'APPROVED':
            case 'READY':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'DECLINED':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Package className="w-5 h-5 text-slate-400" />;
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

    const cancelRequest = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        try {
            await api.cancelRequest(id);
            setRequests(requests.filter((r) => r.id !== id));
        } catch (error) {
            console.error('Failed to cancel request:', error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Success message */}
            {showSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-emerald-700 dark:text-emerald-300">
                        Your request has been submitted successfully! We'll notify you once it's reviewed.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Requests</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Track your equipment requests
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'PENDING', 'APPROVED', 'READY', 'COLLECTED', 'DECLINED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={clsx(
                            'btn',
                            filter === status ? 'btn-primary' : 'btn-secondary'
                        )}
                    >
                        {status === 'all' ? 'All Requests' : status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Requests list */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-24 rounded-2xl" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 card">
                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No requests found</h3>
                    <p className="text-slate-500">
                        {filter === 'all' ? "You haven't made any requests yet" : `No ${filter.toLowerCase()} requests`}
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
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(request.status)}
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {request.items?.length || 0} item{request.items?.length !== 1 ? 's' : ''} requested
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {format(new Date(request.createdAt), 'MMMM d, yyyy • h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`badge ${getStatusBadge(request.status)}`}>
                                        {request.status.replace('_', ' ')}
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
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Requested Items</h4>
                                            <div className="space-y-2">
                                                {request.items?.map((item: any) => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {item.inventoryItem?.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-slate-500">Qty: {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {request.notes && (
                                            <div>
                                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Your Notes</h4>
                                                <p className="text-slate-600 dark:text-slate-400">{request.notes}</p>
                                            </div>
                                        )}

                                        {request.adminNotes && (
                                            <div>
                                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Admin Response</h4>
                                                <p className="text-slate-600 dark:text-slate-400">{request.adminNotes}</p>
                                            </div>
                                        )}

                                        {request.status === 'PENDING' && (
                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <button
                                                    onClick={() => cancelRequest(request.id)}
                                                    className="btn btn-danger"
                                                >
                                                    Cancel Request
                                                </button>
                                            </div>
                                        )}

                                        {request.status === 'READY' && (
                                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                                <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                                                    ✓ Your items are ready for collection at IT Support
                                                </p>
                                            </div>
                                        )}
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
