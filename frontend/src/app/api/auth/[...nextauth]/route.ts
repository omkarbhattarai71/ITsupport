import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
            authorization: {
                params: {
                    scope: 'openid profile email User.Read',
                },
            },
        }),
    ],

    callbacks: {
        // Attach the Microsoft access token and user info to the session
        // so the frontend can use it to call our backend's /api/auth/sso endpoint
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass the id_token through to the client-side session
            (session as any).idToken = token.idToken;
            (session as any).accessToken = token.accessToken;
            return session;
        },
    },

    pages: {
        // Use our custom login page instead of the default NextAuth UI
        signIn: '/login',
        error: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Next.js App Router requires named exports for each HTTP method
export { handler as GET, handler as POST };
