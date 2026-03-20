'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Users, Search, Mail, Building, ClipboardList, Headphones } from 'lucide-react';
import clsx from 'clsx';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    View registered users and their activity
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
                    className="input pl-10"
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
                    <h3 className="text-sm text-slate-500 mb-1">Active This Month</h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {users.filter((u) => u._count?.requests > 0 || u._count?.tickets > 0).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
