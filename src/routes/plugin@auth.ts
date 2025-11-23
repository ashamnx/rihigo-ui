import {QwikAuth$} from "@auth/qwik";
import Google from '@auth/qwik/providers/google';

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(token: any) {
    try {
        const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
        });

        const response = await fetch(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            method: "POST",
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            // Preserve refresh token if new one not provided (Google usually doesn't provide new refresh token)
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.error("Error refreshing access token", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const {onRequest, useSession, useSignIn, useSignOut} = QwikAuth$(
    (event) => ({
        secret: event.env.get('AUTH_SECRET'),
        debug: true,
        providers: [
            Google({
                clientId: event.env.get('AUTH_GOOGLE_ID'),
                clientSecret: event.env.get('AUTH_GOOGLE_SECRET'),
                // Request offline access to get refresh token
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code",
                    },
                },
            }),
        ],
        callbacks: {
            // 1. JWT Callback: Store tokens and handle refresh
            async jwt({ token, account, user }) {
                // Initial sign in - save tokens from account
                if (account && user) {
                    console.log('Initial sign in - storing tokens');
                    return {
                        accessToken: account.access_token,
                        idToken: account.id_token,
                        refreshToken: account.refresh_token,
                        expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
                        user,
                    };
                }

                // Token is still valid, return it
                if (Date.now() < (token.expiresAt as number)) {
                    console.log('Token still valid');
                    return token;
                }

                // Token has expired, try to refresh it
                console.log('Token expired, attempting refresh');
                return await refreshAccessToken(token);
            },

            // 2. Session Callback: Expose tokens and errors to session
            async session({ session, token }) {
                // Expose the ID token to the session for API calls
                if (token.idToken) {
                    (session as any).accessToken = token.idToken;
                }

                // Expose user info
                (session as any).user = token.user;

                // Expose error if token refresh failed
                if (token.error) {
                    (session as any).error = token.error;
                }

                return session;
            },
        },
    }),
);
