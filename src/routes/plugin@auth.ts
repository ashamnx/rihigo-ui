import {QwikAuth$} from "@auth/qwik";
import Google from '@auth/qwik/providers/google';

/**
 * Get or create user in backend database
 * Checks if user exists, creates if not
 */
async function getOrCreateUser(email: string, name?: string, image?: string) {
    try {
        const apiUrl = process.env.API_URL || 'http://localhost:8080';

        // Check if user exists
        const checkResponse = await fetch(`${apiUrl}/api/users/by-email?email=${encodeURIComponent(email)}`);

        if (checkResponse.ok) {
            const data = await checkResponse.json();
            if (data.success && data.data) {
                console.log('User already exists:', data.data.id);
                return data.data;
            }
        }

        // User doesn't exist, create new user
        console.log('Creating new user in backend:', email);
        const createResponse = await fetch(`${apiUrl}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                name: name || undefined,
                image: image || undefined,
                role: 'user',
                preferences: {
                    language: 'en',
                    currency: 'USD',
                },
            }),
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('Failed to create user:', errorData);
            throw new Error(`Failed to create user: ${errorData.error_message || 'Unknown error'}`);
        }

        const createData = await createResponse.json();
        if (createData.success && createData.data) {
            console.log('User created successfully:', createData.data.id);
            return createData.data;
        }

        throw new Error('User creation response was not successful');
    } catch (error) {
        console.error('Error in getOrCreateUser:', error);
        throw error;
    }
}

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
        trustHost: true,
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

                    // Get or create user in backend database
                    try {
                        const backendUser = await getOrCreateUser(
                            user.email as string,
                            user.name || undefined,
                            user.image || undefined
                        );
                        console.log('Backend user synchronized:', backendUser.id);
                    } catch (error) {
                        console.error('Failed to sync user with backend:', error);
                        // Continue with authentication even if backend sync fails
                        // This prevents blocking the user from logging in
                    }

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
