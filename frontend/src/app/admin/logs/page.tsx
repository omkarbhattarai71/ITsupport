'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { FileText, Filter, ArrowUp, ArrowDown, Edit, Trash2, Plus, User } from 'lucide-react';
import clsx from 'clsx';

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [entityFilter, setEntityFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [entityFilter, actionFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminLogs({
                entityType: entityFilter || undefined,
                action: actionFilter || undefined,
                limit: 100,
            });
            setLogs(data.logs);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE':
                return <Plus className="w-4 h-4 text-emerald-500" />;
            case 'UPDATE':
            case 'APPROVE':
                return <Edit className="w-4 h-4 text-blue-500" />;
            case 'DELETE':
            case 'DECLINE':
                return <Trash2 className="w-4 h-4 text-red-500" />;
            default:
                return <ArrowUp className="w-4 h-4 text-slate-500" />;
        }
    };

    const getActionBadge = (action: string) => {
        const badges: Record<string, string> = {
            CREATE: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            UPDATE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            APPROVE: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            DECLINE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            COLLECT: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            RETURN: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        };
        return badges[action] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    };

    const getEntityBadge = (entityType: string) => {
        const badges: Record<string, string> = {
            USER: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
            INVENTORY: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            REQUEST: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            TICKET: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return badges[entityType] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activity Logs</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Track all system activity for auditing
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Entity Type</label>
                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value)}
                        className="input w-40"
                    >
                        <option value="">All Entities</option>
                        <option value="USER">Users</option>
                        <option value="INVENTORY">Inventory</option>
                        <option value="REQUEST">Requests</option>
                        <option value="TICKET">Tickets</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Action</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="input w-40"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="APPROVE">Approve</option>
                        <option value="DECLINE">Decline</option>
                    </select>
                </div>
            </div>

            {/* Logs list */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 card">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No logs found</h3>
                    <p className="text-slate-500">Activity logs will appear here as users interact with the system</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`badge ${getActionBadge(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className={`badge ${getEntityBadge(log.entityType)}`}>
                                            {log.entityType}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-900 dark:text-white">
                                        {log.details || `${log.action} ${log.entityType.toLowerCase()} ${log.entityId}`}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        {log.user && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {log.user.name}
                                            </span>
                                        )}
                                        <span>{format(new Date(log.createdAt), 'MMM d, yyyy • h:mm:ss a')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
