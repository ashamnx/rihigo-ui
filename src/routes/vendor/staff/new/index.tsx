// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeAction$, Form, useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { StaffRole, StaffPermissions, StaffCreateInput } from '~/types/staff';
import {
    staffRoleLabels,
    staffRoleDescriptions,
    staffRoleColors,
    DEFAULT_PERMISSIONS,
    PERMISSION_LABELS,
} from '~/types/staff';

export const useCreateStaff = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const input: StaffCreateInput = {
            name: data.name as string,
            email: data.email as string,
            phone: data.phone as string || undefined,
            role: data.role as StaffRole,
            permissions: data.permissions ? JSON.parse(data.permissions as string) : undefined,
            send_invite: data.send_invite === 'true',
        };

        const result = await apiClient.vendorPortal.staff.create(input, token);
        return { success: result.success, error: result.error_message };
    });
});

export default component$(() => {
    const createAction = useCreateStaff();
    const nav = useNavigate();

    const selectedRole = useSignal<StaffRole>('staff');
    const useCustomPermissions = useSignal(false);
    const sendInvite = useSignal(true);

    // Form state
    const formState = useStore({
        name: '',
        email: '',
        phone: '',
    });

    // Custom permissions state
    const customPermissions = useStore<StaffPermissions>(() => ({
        ...DEFAULT_PERMISSIONS.staff,
    }));

    const roleOptions: StaffRole[] = ['admin', 'manager', 'staff', 'view_only'];

    const handleRoleChange = $((role: StaffRole) => {
        selectedRole.value = role;
        // Reset custom permissions to role defaults
        const defaults = DEFAULT_PERMISSIONS[role];
        Object.assign(customPermissions, defaults);
        useCustomPermissions.value = false;
    });

    const togglePermission = $((category: keyof StaffPermissions, action: string) => {
        useCustomPermissions.value = true;
        const current = (customPermissions[category] as Record<string, boolean>)[action];
        (customPermissions[category] as Record<string, boolean>)[action] = !current;
    });

    // Navigate on success
    if (createAction.value?.success) {
        nav('/vendor/staff');
    }

    return (
        <div class="p-6">
            {/* Header */}
            <div class="mb-6">
                <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                    <a href="/vendor/staff" class="link link-hover">Staff</a>
                    <span>/</span>
                    <span>Add Staff</span>
                </div>
                <h1 class="text-2xl font-bold">Add Staff Member</h1>
                <p class="text-base-content/70 mt-1">
                    Invite a new team member and set their permissions
                </p>
            </div>

            {/* Error Message */}
            {createAction.value?.error && (
                <div class="alert alert-error mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{createAction.value.error}</span>
                </div>
            )}

            <Form action={createAction}>
                <input type="hidden" name="role" value={selectedRole.value} />
                <input type="hidden" name="send_invite" value={String(sendInvite.value)} />
                <input
                    type="hidden"
                    name="permissions"
                    value={useCustomPermissions.value ? JSON.stringify(customPermissions) : ''}
                />

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
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
                                            placeholder="John Doe"
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
                                            placeholder="john@example.com"
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
                                            placeholder="+960 xxx xxxx"
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
                                <p class="text-sm text-base-content/70 mb-4">
                                    Select a role to determine the default permissions for this staff member.
                                </p>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {roleOptions.map((role) => (
                                        <label
                                            key={role}
                                            class={`card cursor-pointer transition-all border-2 ${
                                                selectedRole.value === role
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-base-300 hover:border-primary/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role_select"
                                                class="hidden"
                                                checked={selectedRole.value === role}
                                                onChange$={() => handleRoleChange(role)}
                                            />
                                            <div class="card-body p-4">
                                                <div class="flex items-center justify-between">
                                                    <span class={`badge ${staffRoleColors[role]}`}>
                                                        {staffRoleLabels[role]}
                                                    </span>
                                                    {selectedRole.value === role && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <p class="text-sm text-base-content/70 mt-2">
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
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 class="card-title text-lg">Permissions</h3>
                                        <p class="text-sm text-base-content/70">
                                            {useCustomPermissions.value
                                                ? 'Custom permissions configured'
                                                : `Using default ${staffRoleLabels[selectedRole.value]} permissions`}
                                        </p>
                                    </div>
                                    {useCustomPermissions.value && (
                                        <button
                                            type="button"
                                            class="btn btn-ghost btn-sm"
                                            onClick$={() => {
                                                Object.assign(customPermissions, DEFAULT_PERMISSIONS[selectedRole.value]);
                                                useCustomPermissions.value = false;
                                            }}
                                        >
                                            Reset to Default
                                        </button>
                                    )}
                                </div>

                                <div class="space-y-4">
                                    {(Object.keys(PERMISSION_LABELS) as (keyof StaffPermissions)[]).map((category) => {
                                        const categoryLabels = PERMISSION_LABELS[category];
                                        const permissions = customPermissions[category];

                                        return (
                                            <div key={category} class="border border-base-300 rounded-lg p-4">
                                                <h4 class="font-semibold mb-3">{(categoryLabels as any)._label}</h4>
                                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {Object.entries(permissions).map(([action, enabled]) => {
                                                        const label = (categoryLabels as any)[action];
                                                        if (!label) return null;

                                                        return (
                                                            <label key={action} class="label cursor-pointer justify-start gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    class="checkbox checkbox-sm checkbox-primary"
                                                                    checked={enabled as boolean}
                                                                    onChange$={() => togglePermission(category, action)}
                                                                />
                                                                <span class="label-text text-sm">{label}</span>
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
                        {/* Invite Options */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Invite</h3>

                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            class="toggle toggle-primary"
                                            checked={sendInvite.value}
                                            onChange$={(e) => {
                                                sendInvite.value = (e.target as HTMLInputElement).checked;
                                            }}
                                        />
                                        <div>
                                            <span class="label-text font-medium">Send invitation email</span>
                                            <p class="text-sm text-base-content/70">
                                                The staff member will receive an email to set up their account
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h3 class="card-title text-lg">Summary</h3>

                                <div class="space-y-3 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Role</span>
                                        <span class={`badge ${staffRoleColors[selectedRole.value]}`}>
                                            {staffRoleLabels[selectedRole.value]}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Permissions</span>
                                        <span>{useCustomPermissions.value ? 'Custom' : 'Default'}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Invite</span>
                                        <span>{sendInvite.value ? 'Will be sent' : 'Manual setup'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div class="flex flex-col gap-2">
                            <button type="submit" class="btn btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                                Add Staff Member
                            </button>
                            <a href="/vendor/staff" class="btn btn-ghost">
                                Cancel
                            </a>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Add Staff Member | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Add a new staff member to your team",
        },
    ],
};
