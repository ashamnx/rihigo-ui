import {QwikAuth$} from "@auth/qwik";
import Google from '@auth/qwik/providers/google';

interface BackendUser {
    id: string;
    role: 'admin' | 'user';
    email: string;
    name?: string;
    image?: string;
}

/**
 * Get or create user in backend database using authenticated request
 * Uses the Google ID token to authenticate with our backend
 * Returns user data including role for authorization
 */
async function getOrCreateUser(idToken: string, email: string, name?: string, image?: string): Promise<BackendUser> {
    const apiUrl = process.env.API_URL || 'http://localhost:8080';

    // First, try to get the current user's profile using the authenticated endpoint
    const meResponse = await fetch(`${apiUrl}/api/users/me`, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (meResponse.ok) {
        const data = await meResponse.json() as { success: boolean; data?: BackendUser };
        if (data.success && data.data) {
            console.log('User profile fetched:', data.data.id, 'role:', data.data.role);
            return data.data;
        }
    }

    // User doesn't exist (401/404), create new user via authenticated endpoint
    console.log('Creating new user in backend:', email);
    const createResponse = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
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
        const errorData = await createResponse.json() as { error_message?: string };
        console.error('Failed to create user:', errorData);
        throw new Error(`Failed to create user: ${errorData.error_message || 'Unknown error'}`);
    }

    const createData = await createResponse.json() as { success: boolean; data?: BackendUser };
    if (createData.success && createData.data) {
        console.log('User created successfully:', createData.data.id, 'role:', createData.data.role);
        return createData.data;
    }

    throw new Error('User creation response was not successful');
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

        const refreshedTokens = await response.json() as {
            access_token: string;
            id_token: string;
            expires_in: number;
            refresh_token?: string;
        };

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
        debug: event.env.get('NODE_ENV') !== 'production',
        // Custom cookie configuration for Cloudflare proxy
        // Don't use __Secure- prefix (Cloudflare strips it) but still use secure: true
        useSecureCookies: false,
        cookies: {
            sessionToken: {
                name: 'authjs.session-token',
                options: {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    secure: true, // Must be true for HTTPS sites
                },
            },
            callbackUrl: {
                name: 'authjs.callback-url',
                options: {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    secure: true,
                },
            },
            csrfToken: {
                name: 'authjs.csrf-token',
                options: {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    secure: true,
                },
            },
            pkceCodeVerifier: {
                name: 'authjs.pkce.code_verifier',
                options: {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    secure: true,
                },
            },
        },
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

                    // Get or create user in backend database and fetch role
                    // Use the ID token to authenticate with our backend API
                    let userRole: 'admin' | 'user' = 'user';
                    try {
                        if (account.id_token) {
                            const backendUser = await getOrCreateUser(
                                account.id_token,
                                user.email as string,
                                user.name || undefined,
                                user.image || undefined
                            );
                            console.log('Backend user synchronized:', backendUser.id);
                            userRole = backendUser.role;
                        }
                    } catch (error) {
                        console.error('Failed to sync user with backend:', error);
                        // Continue with authentication even if backend sync fails
                        // Default to 'user' role for safety
                    }

                    return {
                        accessToken: account.access_token,
                        idToken: account.id_token,
                        refreshToken: account.refresh_token,
                        expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
                        user: {
                            ...user,
                            role: userRole,
                        },
                        role: userRole,
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

                // Expose user info with role
                (session as any).user = token.user;

                // Ensure role is available at session level for easy access
                if (token.role) {
                    (session as any).user.role = token.role;
                }

                // Expose error if token refresh failed
                if (token.error) {
                    (session as any).error = token.error;
                }

                return session;
            },
        },
    }),
);
