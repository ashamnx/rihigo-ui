import type { RequestEventLoader, RequestEventAction } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "./api-client";

// Auth utilities for server-side operations
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  role: 'admin' | 'user';
  preferences: {
    language: string;
    currency: string;
    notifications: boolean;
  };
  linkedAccounts: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getUserProfile(requestEvent: RequestEventLoader | RequestEventAction): Promise<UserProfile | null> {
  try {
    const response = await authenticatedRequest(requestEvent, async (token) => {
      return apiClient.users.getProfile(token);
    });

    return response.success ? response.data : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  requestEvent: RequestEventLoader | RequestEventAction,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const response = await authenticatedRequest(requestEvent, async (token) => {
      return apiClient.users.updateProfile(updates, token);
    });

    return response.success;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

// Note: Account linking/merging is now handled by Auth.js adapter
// These functions are kept for backward compatibility but should not be used directly
// Auth.js manages account/session tables automatically

// Helper function to validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to generate secure random tokens
// Uses browser's crypto API which is compatible with both client and server
export function generateSecureToken(): string {
  // Use globalThis.crypto to ensure browser compatibility
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
