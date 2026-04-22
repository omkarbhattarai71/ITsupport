'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    Package,
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    Save,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

interface InventoryItem {
    id: string;
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl?: string;
    isActive: boolean;
}

export default function AdminInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<InventoryItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        imageUrl: '',
    });

    useEffect(() => {
        fetchItems();
    }, [search, selectedCategory]);

    const fetchItems = async () => {
        try {
            const data = await api.getInventory({ search, category: selectedCategory, active: 'all' } as any);
            setItems(data.items);
            setCategories(data.categories);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: InventoryItem) => {
        if (item) {
            setEditing(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                category: item.category,
                quantity: item.quantity,
                imageUrl: item.imageUrl || '',
            });
        } else {
            setEditing(null);
            setFormData({
                name: '',
                description: '',
                category: '',
                quantity: 0,
                imageUrl: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editing) {
                await api.updateInventoryItem(editing.id, formData);
            } else {
                await api.createInventoryItem(formData);
            }
            fetchItems();
            closeModal();
        } catch (error) {
            console.error('Failed to save item:', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await api.deleteInventoryItem(id);
            setItems(items.filter((i) => i.id !== id));
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage IT equipment and stock levels
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    Add Item
                </button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search items..."
                        className="input !pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={clsx(
                            'btn',
                            selectedCategory === '' ? 'btn-primary' : 'btn-secondary'
                        )}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={clsx(
                                'btn',
                                selectedCategory === cat ? 'btn-primary' : 'btn-secondary'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items table */}
            {loading ? (
                <div className="skeleton h-96 rounded-2xl" />
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {item.quantity < 5 && (
                                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                )}
                                                <span className={clsx(
                                                    'font-medium',
                                                    item.quantity === 0 ? 'text-red-600' : item.quantity < 5 ? 'text-yellow-600' : 'text-slate-900 dark:text-white'
                                                )}>
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={clsx(
                                                'badge',
                                                item.quantity > 0 ? 'badge-ready' : 'badge-declined'
                                            )}>
                                                {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(item)}
                                                    className="btn btn-ghost p-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="btn btn-ghost p-2 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {items.length === 0 && (
                        <div className="p-12 text-center">
                            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No items found</h3>
                            <p className="text-slate-500 mb-4">Get started by adding your first inventory item</p>
                            <button onClick={() => openModal()} className="btn btn-primary">
                                <Plus className="w-5 h-5" />
                                Add Item
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl animate-fade-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editing ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button onClick={closeModal} className="btn btn-ghost p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="e.g. Docking Station"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input"
                                    placeholder="e.g. Accessories"
                                    list="categories"
                                    required
                                />
                                <datalist id="categories">
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="input"
                                    placeholder="Item description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    className="input"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {editing ? 'Update' : 'Create'}
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
