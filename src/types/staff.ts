// Staff Management Types

export type StaffRole = 'admin' | 'manager' | 'staff' | 'view_only';

export interface StaffPermissions {
    bookings: {
        view: boolean;
        create: boolean;
        edit: boolean;
        cancel: boolean;
    };
    guests: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
    resources: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
    finance: {
        view: boolean;
        create_invoices: boolean;
        record_payments: boolean;
        manage_refunds: boolean;
    };
    reports: {
        view: boolean;
        export: boolean;
    };
    settings: {
        view: boolean;
        edit: boolean;
    };
    staff: {
        view: boolean;
        manage: boolean;
    };
}

export interface VendorStaff {
    id: string;
    vendor_id: string;
    user_id?: string; // linked user account
    name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    permissions: StaffPermissions;
    is_active: boolean;
    last_active_at?: string;
    invite_sent_at?: string;
    invite_accepted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface StaffFilters {
    search?: string;
    role?: StaffRole;
    is_active?: boolean;
}

export interface StaffCreateInput {
    name: string;
    email: string;
    phone?: string;
    role: StaffRole;
    permissions?: Partial<StaffPermissions>;
    send_invite?: boolean;
}

export interface StaffUpdateInput {
    name?: string;
    email?: string;
    phone?: string;
    role?: StaffRole;
    permissions?: Partial<StaffPermissions>;
    is_active?: boolean;
}

export interface StaffActivity {
    id: string;
    staff_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

// Display helpers
export const staffRoleLabels: Record<StaffRole, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff',
    view_only: 'View Only',
};

export const staffRoleDescriptions: Record<StaffRole, string> = {
    admin: 'Full access to all features including settings and staff management',
    manager: 'Access to most features except system settings and staff management',
    staff: 'Limited access to bookings, guests, and basic operations',
    view_only: 'Read-only access to view data without making changes',
};

export const staffRoleColors: Record<StaffRole, string> = {
    admin: 'badge-error',
    manager: 'badge-warning',
    staff: 'badge-info',
    view_only: 'badge-ghost',
};

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<StaffRole, StaffPermissions> = {
    admin: {
        bookings: { view: true, create: true, edit: true, cancel: true },
        guests: { view: true, create: true, edit: true, delete: true },
        resources: { view: true, create: true, edit: true, delete: true },
        finance: { view: true, create_invoices: true, record_payments: true, manage_refunds: true },
        reports: { view: true, export: true },
        settings: { view: true, edit: true },
        staff: { view: true, manage: true },
    },
    manager: {
        bookings: { view: true, create: true, edit: true, cancel: true },
        guests: { view: true, create: true, edit: true, delete: false },
        resources: { view: true, create: true, edit: true, delete: false },
        finance: { view: true, create_invoices: true, record_payments: true, manage_refunds: false },
        reports: { view: true, export: true },
        settings: { view: true, edit: false },
        staff: { view: true, manage: false },
    },
    staff: {
        bookings: { view: true, create: true, edit: true, cancel: false },
        guests: { view: true, create: true, edit: true, delete: false },
        resources: { view: true, create: false, edit: false, delete: false },
        finance: { view: true, create_invoices: false, record_payments: true, manage_refunds: false },
        reports: { view: false, export: false },
        settings: { view: false, edit: false },
        staff: { view: false, manage: false },
    },
    view_only: {
        bookings: { view: true, create: false, edit: false, cancel: false },
        guests: { view: true, create: false, edit: false, delete: false },
        resources: { view: true, create: false, edit: false, delete: false },
        finance: { view: true, create_invoices: false, record_payments: false, manage_refunds: false },
        reports: { view: true, export: false },
        settings: { view: false, edit: false },
        staff: { view: false, manage: false },
    },
};

// Permission labels for display
export const PERMISSION_LABELS = {
    bookings: {
        _label: 'Bookings',
        view: 'View bookings',
        create: 'Create bookings',
        edit: 'Edit bookings',
        cancel: 'Cancel bookings',
    },
    guests: {
        _label: 'Guests',
        view: 'View guests',
        create: 'Add guests',
        edit: 'Edit guests',
        delete: 'Delete guests',
    },
    resources: {
        _label: 'Resources',
        view: 'View resources',
        create: 'Add resources',
        edit: 'Edit resources',
        delete: 'Delete resources',
    },
    finance: {
        _label: 'Finance',
        view: 'View financial data',
        create_invoices: 'Create invoices',
        record_payments: 'Record payments',
        manage_refunds: 'Manage refunds',
    },
    reports: {
        _label: 'Reports',
        view: 'View reports',
        export: 'Export reports',
    },
    settings: {
        _label: 'Settings',
        view: 'View settings',
        edit: 'Edit settings',
    },
    staff: {
        _label: 'Staff',
        view: 'View staff',
        manage: 'Manage staff',
    },
};

// Helper to check if user has permission
export const hasPermission = (
    staff: VendorStaff,
    category: keyof StaffPermissions,
    action: string
): boolean => {
    if (!staff.is_active) return false;
    const categoryPermissions = staff.permissions[category];
    return (categoryPermissions as Record<string, boolean>)[action] ?? false;
};

// Helper to merge permissions (for custom permissions)
export const mergePermissions = (
    base: StaffPermissions,
    overrides: Partial<StaffPermissions>
): StaffPermissions => {
    const result = { ...base };

    for (const [category, permissions] of Object.entries(overrides)) {
        if (permissions && result[category as keyof StaffPermissions]) {
            result[category as keyof StaffPermissions] = {
                ...result[category as keyof StaffPermissions],
                ...permissions,
            } as any;
        }
    }

    return result;
};

// Activity action labels
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
    login: 'Logged in',
    logout: 'Logged out',
    create_booking: 'Created booking',
    update_booking: 'Updated booking',
    cancel_booking: 'Cancelled booking',
    create_guest: 'Added guest',
    update_guest: 'Updated guest',
    delete_guest: 'Deleted guest',
    create_invoice: 'Created invoice',
    send_invoice: 'Sent invoice',
    record_payment: 'Recorded payment',
    create_refund: 'Created refund',
    approve_refund: 'Approved refund',
    update_settings: 'Updated settings',
};
