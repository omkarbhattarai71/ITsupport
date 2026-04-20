'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Users, Search, Mail, Building, ClipboardList, Headphones, Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

// ── Beautiful confirmation modal ──────────────────────────────────────────────
function DeleteConfirmModal({
    user,
    loading,
    error,
    onConfirm,
    onCancel,
}: {
    user: { name: string; email: string; role: string } | null;
    loading: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop — only close if not loading */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !loading && onCancel()}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        Delete User Account
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        This action cannot be undone.
                    </p>
                </div>

                {/* User card */}
                <div className="mx-6 mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {user.email}
                        </p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {user.role}
                    </span>
                </div>

                {/* Inline error message */}
                {error && (
                    <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Warning */}
                <p className="mx-6 mt-4 text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                    All of their <span className="font-medium text-slate-700 dark:text-slate-300">requests, tickets, and notifications</span> will be permanently removed.
                </p>

                {/* Actions */}
                <div className="p-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getAdminUsers();
            setUsers(data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            setDeleting(true);
            setDeleteError(null);
            const res = await api.deleteUser(userToDelete.id);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            showToast((res as any).message || 'User deleted successfully', 'success');
            setUserToDelete(null);
        } catch (error: any) {
            // Show error inside the modal — don't close it
            setDeleteError(error.message || 'Failed to delete user. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toast notification */}
            {toast && (
                <div
                    className={clsx(
                        'fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium animate-fade-in flex items-center gap-2',
                        toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    )}
                >
                    {toast.type === 'success' ? '✓' : '✗'} {toast.message}
                </div>
            )}

            {/* Delete confirmation modal */}
            <DeleteConfirmModal
                user={userToDelete}
                loading={deleting}
                error={deleteError}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    if (!deleting) {
                        setUserToDelete(null);
                        setDeleteError(null);
                    }
                }}
            />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    View and manage registered users
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input !pl-12 dark:text-black"
                />
            </div>

            {/* Users table */}
            {loading ? (
                <div className="skeleton h-96 rounded-2xl" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Requests</th>
                                    <th>Tickets</th>
                                    <th>Joined</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center text-white font-medium">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Building className="w-4 h-4" />
                                                {user.department || 'Not set'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={clsx(
                                                'badge',
                                                user.role === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {user._count?.requests || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Headphones className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {user._count?.tickets || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-slate-500">
                                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setUserToDelete(user)}
                                                disabled={user.id === currentUser?.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No users found</h3>
                            <p className="text-slate-500">
                                {search ? 'Try adjusting your search' : 'No users have registered yet'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <h3 className="text-sm text-slate-500 mb-1">Total Users</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u.role === 'USER').length}
                    </p>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm text-slate-500 mb-1">Admins</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u.role === 'ADMIN').length}
                    </p>
                </div>
                <div className="card p-6">
                    <h3 className="text-sm text-slate-500 mb-1">Active Users</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u._count?.requests > 0 || u._count?.tickets > 0).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
