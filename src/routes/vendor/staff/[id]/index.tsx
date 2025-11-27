// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, useLocation } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { VendorStaff, StaffRole, StaffPermissions, StaffActivity, StaffUpdateInput } from '~/types/staff';
import {
    staffRoleLabels,
    staffRoleDescriptions,
    staffRoleColors,
    DEFAULT_PERMISSIONS,
    PERMISSION_LABELS,
    ACTIVITY_ACTION_LABELS,
} from '~/types/staff';

interface StaffDetailData {
    staff: VendorStaff;
    activities: StaffActivity[];
}

export const useLoadStaffDetail = routeLoader$<StaffDetailData>(async (requestEvent) => {
    const id = requestEvent.params.id;

    const result = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.staff.get(id, token);
    });

    const staff = result.data as VendorStaff | undefined;

    if (!staff) {
        throw requestEvent.redirect(302, '/vendor/staff');
    }

    // Mock activities - in real implementation, fetch from API
    const activities: StaffActivity[] = [];

    return { staff, activities };
});

export const useUpdateStaff = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const id = requestEvent.params.id;
        const input: StaffUpdateInput = {
            name: data.name as string,
            email: data.email as string,
            phone: data.phone as string || undefined,
            role: data.role as StaffRole,
            permissions: data.permissions ? JSON.parse(data.permissions as string) : undefined,
            is_active: data.is_active === 'true',
        };

        const result = await apiClient.vendorPortal.staff.update(id, input, token);
        return { success: result.success, error: result.error_message };
    });
});

export const useResendInvite = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const id = data.id as string;
        // Note: Resend invite could be a specific endpoint or handled via update
        const result = await apiClient.vendorPortal.staff.update(id, { resend_invite: true }, token);
        return { success: result.success, error: result.error_message };
    });
});

export default component$(() => {
    const staffData = useLoadStaffDetail();
    const updateAction = useUpdateStaff();
    const resendInviteAction = useResendInvite();
    const location = useLocation();

    const isEditing = useSignal(location.url.searchParams.get('edit') === 'true');
    const useCustomPermissions = useSignal(false);

    // Form state
    const formState = useStore<{
        name: string;
        email: string;
        phone: string;
        role: StaffRole;
        is_active: boolean;
    }>(() => ({
        name: staffData.value.staff.name,
        email: staffData.value.staff.email,
        phone: staffData.value.staff.phone || '',
        role: staffData.value.staff.role,
        is_active: staffData.value.staff.is_active,
    }));

    // Custom permissions state
    const customPermissions = useStore<StaffPermissions>(() => ({
        ...staffData.value.staff.permissions,
    }));

    const roleOptions: StaffRole[] = ['admin', 'manager', 'staff', 'view_only'];

    const handleRoleChange = $((role: StaffRole) => {
        formState.role = role;
        Object.assign(customPermissions, DEFAULT_PERMISSIONS[role]);
        useCustomPermissions.value = false;
    });

    const togglePermission = $((category: keyof StaffPermissions, action: string) => {
        useCustomPermissions.value = true;
        const current = (customPermissions[category] as Record<string, boolean>)[action];
        (customPermissions[category] as Record<string, boolean>)[action] = !current;
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    const getRelativeTime = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const staff = staffData.value.staff;

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/staff" class="link link-hover">Staff</a>
                        <span>/</span>
                        <span>{staff.name}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="avatar placeholder">
                            <div class="bg-neutral text-neutral-content rounded-full w-12">
                                <span class="text-xl">{staff.name.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">{staff.name}</h1>
                            <div class="flex items-center gap-2 mt-1">
                                <span class={`badge ${staffRoleColors[staff.role]}`}>
                                    {staffRoleLabels[staff.role]}
                                </span>
                                <span class={`badge ${staff.is_active ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                                    {staff.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {staff.invite_sent_at && !staff.invite_accepted_at && (
                                    <span class="badge badge-warning badge-sm">Pending Invite</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    {!isEditing.value ? (
                        <button
                            class="btn btn-primary"
                            onClick$={() => (isEditing.value = true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                    ) : (
                        <button
                            class="btn btn-ghost"
                            onClick$={() => {
                                isEditing.value = false;
                                // Reset form state
                                formState.name = staff.name;
                                formState.email = staff.email;
                                formState.phone = staff.phone || '';
                                formState.role = staff.role;
                                formState.is_active = staff.is_active;
                                Object.assign(customPermissions, staff.permissions);
                                useCustomPermissions.value = false;
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Success/Error Messages */}
            {updateAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <span>Staff member updated successfully</span>
                </div>
            )}
            {updateAction.value?.error && (
                <div class="alert alert-error mb-4">
                    <span>{updateAction.value.error}</span>
                </div>
            )}
            {resendInviteAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <span>Invitation email sent successfully</span>
                </div>
            )}

            {isEditing.value ? (
                /* Edit Mode */
                <Form action={updateAction}>
                    <input type="hidden" name="role" value={formState.role} />
                    <input type="hidden" name="is_active" value={String(formState.is_active)} />
                    <input
                        type="hidden"
                        name="permissions"
                        value={useCustomPermissions.value ? JSON.stringify(customPermissions) : ''}
                    />

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 space-y-6">
                            {/* Personal Info */}
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Personal Information</h3>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="form-control md:col-span-2">
                                            <label class="label">
                                                <span class="label-text">Full Name *</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                class="input input-bordered"
                                                required
                                                value={formState.name}
                                                onInput$={(e) => {
                                                    formState.name = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Email Address *</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                class="input input-bordered"
                                                required
                                                value={formState.email}
                                                onInput$={(e) => {
                                                    formState.email = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Phone Number</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                class="input input-bordered"
                                                value={formState.phone}
                                                onInput$={(e) => {
                                                    formState.phone = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Role</h3>

                                    <div class="grid grid-cols-2 gap-3">
                                        {roleOptions.map((role) => (
                                            <label
                                                key={role}
                                                class={`card cursor-pointer transition-all border-2 ${
                                                    formState.role === role
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-base-300 hover:border-primary/50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    class="hidden"
                                                    checked={formState.role === role}
                                                    onChange$={() => handleRoleChange(role)}
                                                />
                                                <div class="card-body p-3">
                                                    <span class={`badge ${staffRoleColors[role]} w-fit`}>
                                                        {staffRoleLabels[role]}
                                                    </span>
                                                    <p class="text-xs text-base-content/70 mt-1">
                                                        {staffRoleDescriptions[role]}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Permissions</h3>

                                    <div class="space-y-4">
                                        {(Object.keys(PERMISSION_LABELS) as (keyof StaffPermissions)[]).map((category) => {
                                            const categoryLabels = PERMISSION_LABELS[category];
                                            const permissions = customPermissions[category];

                                            return (
                                                <div key={category} class="border border-base-300 rounded-lg p-3">
                                                    <h4 class="font-medium mb-2">{(categoryLabels as any)._label}</h4>
                                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-1">
                                                        {Object.entries(permissions).map(([action, enabled]) => {
                                                            const label = (categoryLabels as any)[action];
                                                            if (!label) return null;

                                                            return (
                                                                <label key={action} class="label cursor-pointer justify-start gap-2 py-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        class="checkbox checkbox-xs checkbox-primary"
                                                                        checked={enabled as boolean}
                                                                        onChange$={() => togglePermission(category, action)}
                                                                    />
                                                                    <span class="label-text text-xs">{label}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div class="space-y-6">
                            {/* Status */}
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Status</h3>

                                    <div class="form-control">
                                        <label class="label cursor-pointer justify-start gap-4">
                                            <input
                                                type="checkbox"
                                                class="toggle toggle-success"
                                                checked={formState.is_active}
                                                onChange$={(e) => {
                                                    formState.is_active = (e.target as HTMLInputElement).checked;
                                                }}
                                            />
                                            <span class="label-text">Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Save */}
                            <button type="submit" class="btn btn-primary w-full">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </Form>
            ) : (
                /* View Mode */
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        {/* Contact Info */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Contact Information</h3>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <span class="text-sm text-base-content/70">Email</span>
                                        <p class="font-medium">{staff.email}</p>
                                    </div>
                                    <div>
                                        <span class="text-sm text-base-content/70">Phone</span>
                                        <p class="font-medium">{staff.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Permissions</h3>

                                <div class="space-y-4">
                                    {(Object.keys(PERMISSION_LABELS) as (keyof StaffPermissions)[]).map((category) => {
                                        const categoryLabels = PERMISSION_LABELS[category];
                                        const permissions = staff.permissions[category];
                                        const enabledCount = Object.values(permissions).filter(Boolean).length;
                                        const totalCount = Object.keys(permissions).length;

                                        return (
                                            <div key={category} class="border border-base-300 rounded-lg p-3">
                                                <div class="flex items-center justify-between mb-2">
                                                    <h4 class="font-medium">{(categoryLabels as any)._label}</h4>
                                                    <span class="text-sm text-base-content/70">
                                                        {enabledCount}/{totalCount} enabled
                                                    </span>
                                                </div>
                                                <div class="flex flex-wrap gap-1">
                                                    {Object.entries(permissions).map(([action, enabled]) => {
                                                        const label = (categoryLabels as any)[action];
                                                        if (!label) return null;

                                                        return (
                                                            <span
                                                                key={action}
                                                                class={`badge badge-sm ${enabled ? 'badge-success' : 'badge-ghost'}`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Recent Activity</h3>

                                {staffData.value.activities.length > 0 ? (
                                    <div class="space-y-3">
                                        {staffData.value.activities.map((activity) => (
                                            <div key={activity.id} class="flex items-start gap-3 border-b border-base-300 pb-3 last:border-0">
                                                <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                                <div class="flex-1">
                                                    <p class="text-sm">
                                                        {ACTIVITY_ACTION_LABELS[activity.action] || activity.action}
                                                    </p>
                                                    <p class="text-xs text-base-content/50">
                                                        {getRelativeTime(activity.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p class="text-base-content/50 text-center py-4">
                                        No recent activity
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div class="space-y-6">
                        {/* Account Info */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Account</h3>

                                <div class="space-y-3 text-sm">
                                    <div>
                                        <span class="text-base-content/70">Last Active</span>
                                        <p>{getRelativeTime(staff.last_active_at)}</p>
                                    </div>
                                    <div>
                                        <span class="text-base-content/70">Joined</span>
                                        <p>{formatDate(staff.created_at)}</p>
                                    </div>
                                    {staff.invite_sent_at && (
                                        <div>
                                            <span class="text-base-content/70">Invite Sent</span>
                                            <p>{formatDate(staff.invite_sent_at)}</p>
                                        </div>
                                    )}
                                    {staff.invite_accepted_at && (
                                        <div>
                                            <span class="text-base-content/70">Invite Accepted</span>
                                            <p>{formatDate(staff.invite_accepted_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Actions</h3>

                                <div class="space-y-2">
                                    {staff.invite_sent_at && !staff.invite_accepted_at && (
                                        <Form action={resendInviteAction}>
                                            <input type="hidden" name="id" value={staff.id} />
                                            <button type="submit" class="btn btn-outline btn-sm w-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Resend Invite
                                            </button>
                                        </Form>
                                    )}
                                    <button class="btn btn-outline btn-sm w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Reset Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
