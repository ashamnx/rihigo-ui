// Global type declarations for Auth.js extensions
import type { DefaultSession } from "@auth/core/types";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id?: string;
      role?: 'admin' | 'user';
      phone?: string;
      dateOfBirth?: string;
      nationality?: string;
      preferences?: {
        language: string;
        preferred_currency: string; // User's preferred display currency
        notifications: boolean;
      };
      linkedAccounts?: string[];
    } & DefaultSession["user"];
    accessToken?: string;
    error?: string;
  }

  interface User {
    id?: string;
    role?: 'admin' | 'user';
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    preferences?: {
      language: string;
      preferred_currency: string; // User's preferred display currency
      notifications: boolean;
    };
    linkedAccounts?: string[];
  }

  interface JWT {
    userId?: string;
    role?: 'admin' | 'user';
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    preferences?: {
      language: string;
      preferred_currency: string; // User's preferred display currency
      notifications: boolean;
    };
    linkedAccounts?: string[];
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}