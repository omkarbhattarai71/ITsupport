'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, GripHorizontal, Package } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import api from '@/lib/api';

export default function NotificationDetailWindow() {
    const { activeNotificationId, closeNotification } = useNotifications();
    const [detailData, setDetailData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Position state
    const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 - 300 : 0, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activeNotificationId) {
            setDetailData(null);
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const data = await api.getNotificationDetail(activeNotificationId);
                setDetailData(data);
            } catch (error) {
                console.error("Failed to fetch notification detail", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [activeNotificationId]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeNotification();
        };
        if (activeNotificationId) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeNotificationId, closeNotification]);

    if (!activeNotificationId) return null;

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isFullscreen) return;
        // Don't drag on mobile
        if (window.innerWidth < 640) return;
        
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setPosition({
            x: Math.max(0, Math.min(e.clientX - dragStartRef.current.x, window.innerWidth - 600)),
            y: Math.max(0, Math.min(e.clientY - dragStartRef.current.y, window.innerHeight - 100))
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // Render logic for different entities
    const renderContent = () => {
        if (loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
        if (!detailData || !detailData.detail) return <div className="p-12 text-center text-slate-500">No details available.</div>;

        const notif = detailData.notification;
        const detail = detailData.detail;

        if (notif.entityType === 'REQUEST') {
            return (
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Request Details</h3>
                            <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                {detail.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">Requested by {detail.user?.name} ({detail.user?.department})</p>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">Items</h4>
                        <div className="space-y-2">
                            {detail.items.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        {item.inventoryItem.imageUrl ? (
                                            <img src={`${process.env.NEXT_PUBLIC_API_URL || ''}${item.inventoryItem.imageUrl}`} alt={item.inventoryItem.name} className="w-12 h-12 rounded object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.inventoryItem.name}</p>
                                            <p className="text-sm text-slate-500">Requested: {item.quantity}</p>
                                            {item.returnedQuantity > 0 && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Returned: {item.returnedQuantity}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {detail.adminNotes && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Admin Notes</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300">{detail.adminNotes}</p>
                        </div>
                    )}
                </div>
            );
        } else if (notif.entityType === 'TICKET') {
             return (
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{detail.subject}</h3>
                            <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
                                {detail.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">Submitted by {detail.user?.name} ({detail.user?.department})</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detail.description}</p>
                    </div>

                    {detail.resolution && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">Resolution</h4>
                            <p className="text-sm text-green-700 dark:text-green-300">{detail.resolution}</p>
                        </div>
                    )}
                </div>
            );
        }

        return <div className="p-6"><p className="text-slate-600">{notif.message}</p></div>;
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none sm:pointer-events-auto">
            {/* Mobile backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm sm:hidden pointer-events-auto transition-opacity" 
                onClick={closeNotification}
            />

            {/* Window Container */}
            <div
                ref={windowRef}
                style={
                    window.innerWidth < 640 ? {} : 
                    isFullscreen ? {
                        top: '2rem', left: '2rem', right: '2rem', bottom: '2rem',
                        width: 'auto', height: 'auto', transform: 'none'
                    } : {
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        width: '600px',
                        height: '600px',
                        maxWidth: 'calc(100vw - 40px)',
                        maxHeight: 'calc(100vh - 40px)',
                    }
                }
                className={`
                    absolute bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700
                    flex flex-col overflow-hidden pointer-events-auto
                    max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:h-[85vh] max-sm:!transform-none max-sm:transition-transform max-sm:duration-300
                    sm:rounded-xl sm:transition-all sm:duration-200
                    ${isDragging ? 'cursor-grabbing transition-none' : ''}
                `}
            >
                {/* Header (Draggable) */}
                <div 
                    className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 select-none sm:cursor-grab active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div className="flex items-center gap-2 text-slate-500">
                        <GripHorizontal className="w-4 h-4 hidden sm:block" />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                            {detailData?.notification?.title || 'Notification Details'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hidden sm:block"
                            title={isFullscreen ? "Restore" : "Maximize"}
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); closeNotification(); }}
                            className="p-1.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded text-slate-500 transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
