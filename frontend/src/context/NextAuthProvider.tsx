'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { Session } from 'next-auth';

interface Props {
    children: ReactNode;
    session?: Session | null;
}

export function NextAuthProvider({ children, session }: Props) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
