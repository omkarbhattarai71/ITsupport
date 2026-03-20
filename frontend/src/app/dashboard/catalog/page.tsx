'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Search,
    Filter,
    Package,
    Plus,
    Minus,
    ShoppingCart,
    X,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import clsx from 'clsx';

interface InventoryItem {
    id: string;
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl?: string;
}

interface CartItem {
    item: InventoryItem;
    quantity: number;
}

export default function CatalogPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await api.getInventory({ search, category: selectedCategory });
                setItems(data.items);
                setCategories(data.categories);
            } catch (error) {
                console.error('Failed to fetch items:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [search, selectedCategory]);

    const addToCart = (item: InventoryItem) => {
        const existing = cart.find((c) => c.item.id === item.id);
        if (existing) {
            setCart(cart.map((c) =>
                c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
            ));
        } else {
            setCart([...cart, { item, quantity: 1 }]);
        }
    };

    const removeFromCart = (itemId: string) => {
        const existing = cart.find((c) => c.item.id === itemId);
        if (existing && existing.quantity > 1) {
            setCart(cart.map((c) =>
                c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
            ));
        } else {
            setCart(cart.filter((c) => c.item.id !== itemId));
        }
    };

    const clearCart = () => {
        setCart([]);
        setNotes('');
    };

    const getCartItemQuantity = (itemId: string) => {
        const item = cart.find((c) => c.item.id === itemId);
        return item?.quantity || 0;
    };

    const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

    const submitRequest = async () => {
        if (cart.length === 0) return;

        setSubmitting(true);
        try {
            await api.createRequest({
                items: cart.map((c) => ({
                    inventoryItemId: c.item.id,
                    quantity: c.quantity,
                })),
                notes,
            });
            clearCart();
            setCartOpen(false);
            router.push('/dashboard/requests?success=true');
        } catch (error) {
            console.error('Failed to submit request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Equipment Catalog</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Browse and request IT equipment
                    </p>
                </div>

                {/* Cart button */}
                <button
                    onClick={() => setCartOpen(true)}
                    className="btn btn-primary relative"
                >
                    <ShoppingCart className="w-5 h-5" />
                    Request Cart
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
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
                        placeholder="Search equipment..."
                        className="input pl-10"
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

            {/* Items grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="skeleton h-64 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        const cartQty = getCartItemQuantity(item.id);
                        return (
                            <div key={item.id} className="card card-hover overflow-hidden">
                                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                    <Package className="w-16 h-16 text-slate-400" />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                                        <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {item.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={clsx(
                                            'text-sm font-medium',
                                            item.quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                                        )}>
                                            {item.quantity > 0 ? `${item.quantity} available` : 'Out of stock'}
                                        </span>
                                        {item.quantity > 0 && (
                                            cartQty > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="btn btn-secondary p-2"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{cartQty}</span>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="btn btn-secondary p-2"
                                                        disabled={cartQty >= item.quantity}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="btn btn-primary"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No items found</h3>
                    <p className="text-slate-500">Try adjusting your search or filter</p>
                </div>
            )}

            {/* Cart sidebar */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full overflow-auto animate-slide-in-right">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Cart</h2>
                            <button onClick={() => setCartOpen(false)} className="btn btn-ghost p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="p-6 text-center">
                                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Your cart is empty</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 space-y-4">
                                    {cart.map(({ item, quantity }) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                                                <Package className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-sm text-slate-500">Qty: {quantity}</p>
                                            </div>
                                            <button
                                                onClick={() => setCart(cart.filter((c) => c.item.id !== item.id))}
                                                className="text-red-500 hover:text-red-600 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            className="input"
                                            placeholder="Any special requirements..."
                                        />
                                    </div>

                                    <button
                                        onClick={submitRequest}
                                        disabled={submitting}
                                        className="btn btn-primary w-full py-3"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Request
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={clearCart}
                                        className="btn btn-ghost w-full mt-2"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
