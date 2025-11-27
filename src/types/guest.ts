// Guest Management Types

export type GuestSourceType = 'direct' | 'platform' | 'ota' | 'agent';
export type GuestIdType = 'passport' | 'national_id' | 'driver_license';
export type GuestLoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type GuestGender = 'male' | 'female' | 'other';

export interface GuestPreferences {
    dietary?: string[];
    accessibility?: string[];
    room?: string[];
    other?: string;
}

export interface Guest {
    id: string;
    vendor_id: string;
    source_type: GuestSourceType;
    source_name?: string;
    external_reference?: string;

    // Personal Info
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    nationality?: string;
    country_of_residence?: string;
    date_of_birth?: string;
    gender?: GuestGender;
    preferred_language?: string;

    // Identification
    id_type?: GuestIdType;
    id_number?: string;
    id_expiry_date?: string;
    id_document_url?: string;

    // Preferences
    preferences?: GuestPreferences;
    notes?: string;
    tags?: string[];

    // Statistics
    total_bookings: number;
    total_spend: number;
    first_visit_at?: string;
    last_visit_at?: string;
    loyalty_tier?: GuestLoyaltyTier;

    created_at: string;
    updated_at: string;
}

export interface GuestFilters {
    search?: string;
    source_type?: GuestSourceType;
    loyalty_tier?: GuestLoyaltyTier;
    tags?: string[];
    page?: number;
    limit?: number;
}

export interface GuestCreateInput {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    nationality?: string;
    country_of_residence?: string;
    date_of_birth?: string;
    gender?: GuestGender;
    preferred_language?: string;
    id_type?: GuestIdType;
    id_number?: string;
    id_expiry_date?: string;
    preferences?: GuestPreferences;
    notes?: string;
    tags?: string[];
    source_type?: GuestSourceType;
    source_name?: string;
}

export interface GuestUpdateInput extends Partial<GuestCreateInput> {}

export type GuestHistoryAction = 'created' | 'updated' | 'merged' | 'deleted';

export interface GuestHistory {
    id: string;
    guest_id: string;
    action: GuestHistoryAction;
    changed_by: string;
    changes: Record<string, { before: unknown; after: unknown }>;
    created_at: string;
}

export interface GuestMergeInput {
    primary_id: string;
    duplicate_ids: string[];
}

// Display helpers
export const guestSourceLabels: Record<GuestSourceType, string> = {
    direct: 'Direct',
    platform: 'Platform',
    ota: 'OTA',
    agent: 'Agent',
};

export const guestLoyaltyLabels: Record<GuestLoyaltyTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
};

export const guestIdTypeLabels: Record<GuestIdType, string> = {
    passport: 'Passport',
    national_id: 'National ID',
    driver_license: 'Driver License',
};

// Helper function to get full name
export const getGuestFullName = (guest: Guest): string => {
    return `${guest.first_name} ${guest.last_name}`.trim();
};
