import {QwikAuth$} from "@auth/qwik";
import Google from '@auth/qwik/providers/google';
import Credentials from '@auth/qwik/providers/credentials';

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
 * Craft a JWT token for test authentication that the Go backend will accept.
 * Requires SKIP_SIGNATURE_VERIFICATION=true on the backend.
 */
function craftTestToken(userId: string, email: string, googleClientId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: 'test' };
    const payload = {
        sub: userId,
        email,
        email_verified: true,
        name: 'Test User',
        iss: 'accounts.google.com',
        aud: googleClientId,
        iat: now,
        exp: now + 86400,
    };

    const encode = (obj: Record<string, unknown>) =>
        Buffer.from(JSON.stringify(obj)).toString('base64url');

    return `${encode(header)}.${encode(payload)}.test-signature`;
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
    (event) => {
        const providers: any[] = [
            Google({
                clientId: event.env.get('AUTH_GOOGLE_ID'),
                clientSecret: event.env.get('AUTH_GOOGLE_SECRET'),
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code",
                    },
                },
            }),
        ];

        if (event.env.get('AUTH_TEST_MODE') === 'true') {
            providers.push(
                Credentials({
                    id: 'test-credentials',
                    name: 'Test Login',
                    credentials: {
                        email: { label: 'Email', type: 'email' },
                        password: { label: 'Password', type: 'password' },
                    },
                    async authorize(credentials) {
                        const testSecret = process.env.AUTH_TEST_SECRET;
                        if (!testSecret) return null;
                        if (!credentials || credentials.password !== testSecret) return null;
                        if (!credentials.email) return null;

                        const email = credentials.email as string;
                        const nameMap: Record<string, string> = {
                            'testuser@rihigo.test': 'Test User',
                            'testadmin@rihigo.test': 'Test Admin',
                            'testvendor@rihigo.test': 'Test Vendor',
                        };
                        return {
                            id: `test-${email}`,
                            email,
                            name: nameMap[email] || 'Test User',
                            image: '',
                        };
                    },
                })
            );
        }

        return {
            secret: event.env.get('AUTH_SECRET'),
            trustHost: true,
            debug: event.env.get('NODE_ENV') !== 'production',
            useSecureCookies: false,
            cookies: {
                sessionToken: {
                    name: 'authjs.session-token',
                    options: {
                        httpOnly: true,
                        sameSite: 'lax',
                        path: '/',
                        secure: true,
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
            providers,
            callbacks: {
                async jwt({ token, account, user }) {
                    if (account && user) {
                        console.log('Initial sign in - storing tokens, provider:', account.provider);

                        let idToken = account.id_token;
                        let userRole: 'admin' | 'user' = 'user';

                        // For test-credentials provider, craft a JWT the backend will accept
                        if (account.provider === 'test-credentials') {
                            const googleClientId = process.env.AUTH_GOOGLE_ID || '';
                            idToken = craftTestToken(user.id as string, user.email as string, googleClientId);
                        }

                        try {
                            if (idToken) {
                                const backendUser = await getOrCreateUser(
                                    idToken,
                                    user.email as string,
                                    user.name || undefined,
                                    user.image || undefined
                                );
                                console.log('Backend user synchronized:', backendUser.id);
                                userRole = backendUser.role;
                            }
                        } catch (error) {
                            console.error('Failed to sync user with backend:', error);
                        }

                        return {
                            accessToken: account.provider === 'test-credentials' ? idToken : account.access_token,
                            idToken,
                            refreshToken: account.refresh_token || null,
                            expiresAt: account.provider === 'test-credentials'
                                ? Date.now() + 86400 * 1000
                                : (account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000),
                            user: {
                                ...user,
                                role: userRole,
                            },
                            role: userRole,
                            provider: account.provider,
                        };
                    }

                    if (Date.now() < (token.expiresAt as number)) {
                        return token;
                    }

                    // Test tokens don't have refresh tokens — re-craft instead
                    if (token.provider === 'test-credentials') {
                        const googleClientId = process.env.AUTH_GOOGLE_ID || '';
                        const user = token.user as any;
                        const newToken = craftTestToken(user?.id || '', user?.email || '', googleClientId);
                        return {
                            ...token,
                            idToken: newToken,
                            accessToken: newToken,
                            expiresAt: Date.now() + 86400 * 1000,
                        };
                    }

                    console.log('Token expired, attempting refresh');
                    return await refreshAccessToken(token);
                },

                async session({ session, token }) {
                    if (token.idToken) {
                        (session as any).accessToken = token.idToken;
                    }

                    (session as any).user = token.user;

                    if (token.role) {
                        (session as any).user.role = token.role;
                    }

                    if (token.error) {
                        (session as any).error = token.error;
                    }

                    return session;
                },
            },
        };
    },
);
