import { component$ } from '@builder.io/qwik';

export type BadgeVariant =
    | 'primary' | 'secondary' | 'accent' | 'neutral'
    | 'info' | 'success' | 'warning' | 'error' | 'ghost';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
    status: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    outline?: boolean;
    class?: string;
}

// Status to variant mapping
const statusVariants: Record<string, BadgeVariant> = {
    // Booking statuses
    pending: 'warning',
    confirmed: 'info',
    checked_in: 'success',
    checked_out: 'neutral',
    cancelled: 'error',
    no_show: 'ghost',

    // Payment statuses
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
    refunded: 'info',
    partially_refunded: 'accent',

    // Invoice statuses
    draft: 'ghost',
    sent: 'info',
    overdue: 'error',
    void: 'ghost',

    // Quotation statuses
    viewed: 'primary',
    accepted: 'success',
    rejected: 'error',
    expired: 'warning',
    converted: 'accent',

    // Resource statuses
    available: 'success',
    maintenance: 'warning',
    retired: 'ghost',

    // Discount statuses
    active: 'success',
    paused: 'warning',
    depleted: 'error',

    // Refund statuses
    approved: 'info',
    processing: 'primary',
    completed: 'success',

    // Generic
    enabled: 'success',
    disabled: 'ghost',
    yes: 'success',
    no: 'error',
};

// Status label formatting
const formatStatusLabel = (status: string): string => {
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const StatusBadge = component$<StatusBadgeProps>(({
    status,
    variant,
    size = 'sm',
    outline = false,
    class: className = '',
}) => {
    const resolvedVariant = variant || statusVariants[status.toLowerCase()] || 'neutral';

    const sizeClasses: Record<BadgeSize, string> = {
        xs: 'badge-xs',
        sm: 'badge-sm',
        md: '',
        lg: 'badge-lg',
    };

    const variantClasses: Record<BadgeVariant, string> = {
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        accent: 'badge-accent',
        neutral: 'badge-neutral',
        info: 'badge-info',
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        ghost: 'badge-ghost',
    };

    return (
        <span
            class={[
                'badge',
                sizeClasses[size],
                variantClasses[resolvedVariant],
                outline ? 'badge-outline' : '',
                className,
            ].filter(Boolean).join(' ')}
        >
            {formatStatusLabel(status)}
        </span>
    );
});

// Convenience components for specific status types
export const BookingStatusBadge = component$<{ status: string; size?: BadgeSize }>(({ status, size }) => (
    <StatusBadge status={status} size={size} />
));

export const PaymentStatusBadge = component$<{ status: string; size?: BadgeSize }>(({ status, size }) => (
    <StatusBadge status={status} size={size} />
));

export const InvoiceStatusBadge = component$<{ status: string; size?: BadgeSize }>(({ status, size }) => (
    <StatusBadge status={status} size={size} />
));
