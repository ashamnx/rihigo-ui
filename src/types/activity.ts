// ====================================
// Geographic Types (Maldives Specific)
// ====================================

export interface Atoll {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Island {
    id: number;
    atoll_id?: number;
    name: string;
    type: 'resort' | 'local' | 'uninhabited' | 'airport';
    latitude?: number;
    longitude?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    atoll?: Atoll;
}

// ====================================
// Language & Currency Types
// ====================================

export interface Language {
    code: string;
    name: string;
    is_rtl: boolean;
    is_active: boolean;
    created_at: string;
}

export interface Currency {
    code: string;
    symbol: string;
    exchange_rate_to_base: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ====================================
// Translation Types
// ====================================

export interface Translation {
    id: number;
    entity_type: string;
    entity_id: string;
    language_code: string;
    field_key: string;
    translation_text: string;
    created_at: string;
    updated_at: string;
}

export type TranslationMap = Record<string, Record<string, string>>;

// ====================================
// Activity Category Types
// ====================================

export interface ActivityCategory {
    id: number;
    name: string;
    icon: string;
    description: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ====================================
// Page Builder Types
// ====================================

export type PageComponentType =
    | 'hero'
    | 'activity-hero'
    | 'itinerary'
    | 'faq'
    | 'reviews'
    | 'gallery'
    | 'pricing'
    | 'description'
    | 'overview'
    | 'highlights'
    | 'inclusions'
    | 'map';

export interface PageComponent {
    type: PageComponentType;
    props: Record<string, any>;
}

export interface HeroComponentProps {
    title?: string;
    description?: string;
    backgroundImage?: string;
    overlayOpacity?: number;
}

export interface ItineraryStep {
    time?: string;
    title: string;
    description: string;
    icon?: string;
}

export interface ItineraryComponentProps {
    steps: ItineraryStep[];
}

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQComponentProps {
    items: FAQItem[];
}

export interface GalleryComponentProps {
    images: Array<{
        url: string;
        caption?: string;
        alt?: string;
    }>;
    layout?: 'grid' | 'carousel' | 'masonry';
}

export interface SEOMetadata {
    title: string;
    description: string;
    og_image?: string;
    keywords?: string[];
}

// ====================================
// Activity Types
// ====================================

export interface Activity {
    max_participants: number | undefined;
    base_price: number;
    id: string;
    category_id?: number;
    island_id?: number;
    vendor_id?: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    page_layout: PageComponent[];
    seo_metadata: SEOMetadata;
    review_score: number;
    review_count: number;
    min_price_usd: number;
    images?: string[] | string; // Can be array of URLs or JSON string
    booking_type?: 'standard' | 'digital_product' | 'accommodation' | 'transfer' | 'tour' | 'rental';
    booking_field_config?: any; // BookingFieldConfig from booking-fields.ts
    created_at: string;
    updated_at: string;

    // Joined data
    category?: ActivityCategory;
    island?: Island;
    translations?: TranslationMap;
    packages?: ActivityPackage[];
}

// ====================================
// Package Types
// ====================================

export type BookingType = 'fixed_date' | 'open_date' | 'instant_confirmation';

export interface PackageOptionsConfig {
    // For eSIM packages
    validity_days?: number;
    data_limit?: string;

    // For tour packages
    min_pax?: number;
    max_pax?: number;
    pickup_included?: boolean;
    start_time?: string;
    duration?: number; // in minutes
    meeting_point?: string;

    // Custom fields
    custom?: Record<string, any>;
}

export interface ActivityPackage {
    id: string;
    activity_id: string;
    name_internal: string;
    booking_type: BookingType;
    options_config: PackageOptionsConfig;
    is_active: boolean;
    is_recommended?: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;

    // Joined data
    translations?: TranslationMap;
    prices?: PackagePrice[];
    inventory?: PackageInventory[];
}

export interface PackagePrice {
    id: number;
    package_id: string;
    currency_code: string;
    amount: number;
    market_segment: string;
    created_at: string;
    updated_at: string;

    // Joined data
    currency?: Currency;
}

export interface PackageInventory {
    id: number;
    package_id: string;
    target_date?: string; // null = unlimited inventory
    available_quota: number;
    booked_count: number;
    version: number;
    created_at: string;
    updated_at: string;
}

// ====================================
// API Input Types
// ====================================

export interface CreateActivityInput {
    category_id?: number;
    island_id?: number;
    vendor_id?: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    page_layout: PageComponent[];
    seo_metadata: SEOMetadata;
}

export interface UpdateActivityInput {
    category_id?: number;
    island_id?: number;
    vendor_id?: string;
    slug?: string;
    status?: 'draft' | 'published' | 'archived';
    page_layout?: PageComponent[];
    seo_metadata?: SEOMetadata;
}

export interface CreatePackageInput {
    activity_id: string;
    name_internal: string;
    booking_type: BookingType;
    options_config: PackageOptionsConfig;
    sort_order?: number;
}

export interface UpdatePackageInput {
    name_internal?: string;
    booking_type?: BookingType;
    options_config?: PackageOptionsConfig;
    is_active?: boolean;
    sort_order?: number;
}

export interface CreateTranslationInput {
    entity_type: string;
    entity_id: string;
    language_code: string;
    field_key: string;
    translation_text: string;
}

export interface BulkTranslationsInput {
    entity_type: string;
    entity_id: string;
    translations: TranslationMap;
}

export interface CreatePackagePriceInput {
    package_id: string;
    currency_code: string;
    amount: number;
    market_segment?: string;
}

// ====================================
// API Response Types
// ====================================

export interface ActivityListResponse {
    data: Activity[];
    page: number;
    page_size: number;
    total: number;
}

export interface ActivityDetailResponse {
    data: Activity;
}

export interface APIResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

// ====================================
// Filter & Query Types
// ====================================

export interface ActivityFilters {
    page?: number;
    page_size?: number;
    category_id?: number;
    island_id?: number;
    lang?: string;
}

export interface IslandFilters {
    atoll_id?: number;
}
