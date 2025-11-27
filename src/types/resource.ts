// Resource Management Types

export type ServiceType = 'accommodation' | 'tour' | 'transfer' | 'rental' | 'activity';
export type ResourceType = 'room' | 'vehicle' | 'equipment' | 'boat';
export type ResourceStatus = 'available' | 'maintenance' | 'retired';
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'villa' | 'dormitory';
export type ViewType = 'ocean' | 'garden' | 'pool' | 'city' | 'mountain';
export type BedType = 'single' | 'double' | 'queen' | 'king' | 'bunk' | 'sofa';
export type AmenityCategory = 'room' | 'property' | 'bathroom' | 'entertainment' | 'safety';
export type AvailabilityStatus = 'available' | 'blocked' | 'maintenance';
export type DiscountType = 'percentage' | 'fixed';

export interface BedConfig {
    type: BedType;
    count: number;
}

export interface AccommodationDetails {
    room_type: RoomType;
    bed_configuration: BedConfig[];
    size_sqm?: number;
    floor_level?: number;
    view_type?: ViewType;
    is_smoking_allowed: boolean;
}

export interface ResourceMedia {
    id: string;
    resource_id: string;
    media_type: 'image' | 'video' | 'document';
    url: string;
    alt_text?: string;
    sort_order: number;
    is_primary: boolean;
}

export interface Amenity {
    id: string;
    category: AmenityCategory;
    name: string;
    icon?: string;
    translations?: Record<string, string>;
}

export interface ResourceAmenity {
    id: string;
    resource_id: string;
    amenity_id: string;
    amenity?: Amenity;
    is_included: boolean;
    additional_cost?: number;
}

export interface VendorService {
    id: string;
    vendor_id: string;
    service_category: 'food' | 'transport' | 'wellness' | 'activity';
    name: string;
    description?: string;
    pricing_type: 'per_person' | 'per_unit' | 'per_night' | 'per_booking';
    price: number;
    currency: string;
    availability?: {
        schedule?: string[];
        blackout_dates?: string[];
    };
    is_active: boolean;
}

export interface ResourceService {
    id: string;
    resource_id: string;
    service_id: string;
    service?: VendorService;
    is_mandatory: boolean;
    override_price?: number;
}

export interface VendorResource {
    id: string;
    vendor_id: string;
    service_type: ServiceType;
    resource_type: ResourceType;
    name: string;
    description?: string;
    code?: string;

    // Capacity
    max_adults: number;
    max_children: number;
    max_occupancy: number;

    // Pricing
    base_price: number;
    currency: string;

    // Status
    status: ResourceStatus;

    // Settings
    settings?: Record<string, unknown>;

    // Media
    media?: ResourceMedia[];

    // Accommodation-specific
    accommodation_details?: AccommodationDetails;

    // Related
    amenities?: ResourceAmenity[];
    services?: ResourceService[];

    created_at: string;
    updated_at: string;
}

export interface ResourceAvailability {
    id: string;
    resource_id: string;
    date: string;
    available_count: number;
    status: AvailabilityStatus;
    price_override?: number;
    min_stay?: number;
    max_stay?: number;
    notes?: string;
}

export interface RatePlan {
    id: string;
    resource_id: string;
    name: string;
    discount_type: DiscountType;
    discount_value: number;
    valid_from: string;
    valid_to: string;
    booking_window_days?: number;
    min_stay?: number;
    max_stay?: number;
    is_active: boolean;
}

export interface ResourceFilters {
    search?: string;
    service_type?: ServiceType;
    resource_type?: ResourceType;
    status?: ResourceStatus;
    page?: number;
    limit?: number;
}

export interface ResourceCreateInput {
    name: string;
    description?: string;
    code?: string;
    service_type: ServiceType;
    resource_type: ResourceType;
    max_adults: number;
    max_children: number;
    max_occupancy: number;
    base_price: number;
    currency: string;
    status?: ResourceStatus;
    accommodation_details?: AccommodationDetails;
    settings?: Record<string, unknown>;
}

export interface ResourceUpdateInput extends Partial<ResourceCreateInput> {}

export interface AmenityInput {
    amenity_id: string;
    is_included: boolean;
    additional_cost?: number;
}

export interface AvailabilityUpdate {
    date: string;
    available_count?: number;
    status?: AvailabilityStatus;
    price_override?: number;
    min_stay?: number;
    max_stay?: number;
    notes?: string;
}

export interface RatePlanInput {
    name: string;
    discount_type: DiscountType;
    discount_value: number;
    valid_from: string;
    valid_to: string;
    booking_window_days?: number;
    min_stay?: number;
    max_stay?: number;
    is_active?: boolean;
}

// Display helpers
export const serviceTypeLabels: Record<ServiceType, string> = {
    accommodation: 'Accommodation',
    tour: 'Tour',
    transfer: 'Transfer',
    rental: 'Rental',
    activity: 'Activity',
};

export const resourceTypeLabels: Record<ResourceType, string> = {
    room: 'Room',
    vehicle: 'Vehicle',
    equipment: 'Equipment',
    boat: 'Boat',
};

export const resourceStatusLabels: Record<ResourceStatus, string> = {
    available: 'Available',
    maintenance: 'Maintenance',
    retired: 'Retired',
};

export const roomTypeLabels: Record<RoomType, string> = {
    standard: 'Standard',
    deluxe: 'Deluxe',
    suite: 'Suite',
    villa: 'Villa',
    dormitory: 'Dormitory',
};

export const viewTypeLabels: Record<ViewType, string> = {
    ocean: 'Ocean View',
    garden: 'Garden View',
    pool: 'Pool View',
    city: 'City View',
    mountain: 'Mountain View',
};

export const bedTypeLabels: Record<BedType, string> = {
    single: 'Single',
    double: 'Double',
    queen: 'Queen',
    king: 'King',
    bunk: 'Bunk',
    sofa: 'Sofa Bed',
};

// Helper to get resource type options based on service type
export const getResourceTypesForService = (serviceType: ServiceType): ResourceType[] => {
    switch (serviceType) {
        case 'accommodation':
            return ['room'];
        case 'transfer':
            return ['vehicle', 'boat'];
        case 'rental':
            return ['vehicle', 'equipment', 'boat'];
        case 'tour':
        case 'activity':
            return ['vehicle', 'boat', 'equipment'];
        default:
            return ['room', 'vehicle', 'equipment', 'boat'];
    }
};
