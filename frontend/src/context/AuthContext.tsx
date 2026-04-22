'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    department?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAdmin: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [syncing, setSyncing] = useState(false);

    // When Microsoft SSO session is ready, exchange for our app's JWT
    useEffect(() => {
        if (status === 'authenticated' && session && !user && !syncing) {
            syncWithBackend(session);
        }
        if (status === 'unauthenticated') {
            // Clear everything when Microsoft session ends
            api.setToken(null);
            setUser(null);
        }
    }, [status, session]);

    const syncWithBackend = async (session: any) => {
        setSyncing(true);
        try {
            // Send Microsoft ID token to our backend
            // Backend verifies it and returns our app's JWT + user profile
            const idToken = (session as any).idToken;
            if (!idToken) {
                console.error('No ID token in session');
                return;
            }

            const { user: appUser, token } = await api.ssoExchange(idToken);
            api.setToken(token);
            setUser(appUser);
        } catch (err) {
            console.error('SSO backend sync failed:', err);
            // Force sign out of Microsoft session too if backend rejects
            await signOut({ redirect: false });
        } finally {
            setSyncing(false);
        }
    };

    const refreshUser = async () => {
        try {
            const { user: freshUser } = await api.getMe();
            setUser(freshUser);
        } catch {
            // Token expired or invalid — log out
            logout();
        }
    };

    const logout = async () => {
        // We do NOT call setUser(null) here to prevent UI flickering.
        // signOut with redirect:true cleanly navigates away, and 
        // the useEffect above handles the actual cleanup when status becomes 'unauthenticated'.
        await signOut({ callbackUrl: '/login', redirect: true });
    };

    const loading = status === 'loading' || syncing;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                logout,
                isAdmin: user?.role === 'ADMIN',
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
