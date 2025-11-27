import { component$, useSignal, useStore } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { VendorStaff, StaffRole, StaffFilters } from '~/types/staff';
import { staffRoleLabels, staffRoleColors } from '~/types/staff';

export const useLoadStaff = routeLoader$<VendorStaff[]>(async (requestEvent) => {
    const result = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.staff.list(token);
    });
    return result.data?.staff || [];
});

export const useToggleStaffStatus = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const id = data.id as string;
        const newStatus = data.new_status === 'true';
        const result = await apiClient.vendorPortal.staff.toggleStatus(id, newStatus, token);
        return { success: result.success, error: result.error_message };
    });
});

export const useDeleteStaff = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const id = data.id as string;
        const result = await apiClient.vendorPortal.staff.delete(id, token);
        return { success: result.success, error: result.error_message };
    });
});

export default component$(() => {
    const staffMembers = useLoadStaff();
    const toggleStatusAction = useToggleStaffStatus();
    const deleteAction = useDeleteStaff();

    const filters = useStore<StaffFilters>({
        search: '',
        role: undefined,
        is_active: undefined,
    });

    const showDeleteConfirm = useSignal(false);
    const staffToDelete = useSignal<VendorStaff | null>(null);

    // Filter staff based on current filters
    const filteredStaff = staffMembers.value.filter((staff) => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (
                !staff.name.toLowerCase().includes(searchLower) &&
                !staff.email.toLowerCase().includes(searchLower)
            ) {
                return false;
            }
        }
        if (filters.role && staff.role !== filters.role) {
            return false;
        }
        if (filters.is_active !== undefined && staff.is_active !== filters.is_active) {
            return false;
        }
        return true;
    });

    // Stats
    const stats = {
        total: staffMembers.value.length,
        active: staffMembers.value.filter((s) => s.is_active).length,
        admins: staffMembers.value.filter((s) => s.role === 'admin').length,
        pending: staffMembers.value.filter((s) => s.invite_sent_at && !s.invite_accepted_at).length,
    };

    const roleOptions: StaffRole[] = ['admin', 'manager', 'staff', 'view_only'];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString();
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
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Staff Management</h1>
                    <p class="text-base-content/70 mt-1">
                        Manage team members and their access permissions
                    </p>
                </div>
                <a href="/vendor/staff/new" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Add Staff
                </a>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Staff</div>
                    <div class="stat-value text-lg">{stats.total}</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Active</div>
                    <div class="stat-value text-lg text-success">{stats.active}</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Administrators</div>
                    <div class="stat-value text-lg text-error">{stats.admins}</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Pending Invites</div>
                    <div class="stat-value text-lg text-warning">{stats.pending}</div>
                </div>
            </div>

            {/* Filters */}
            <div class="card bg-base-100 shadow mb-6">
                <div class="card-body py-4">
                    <div class="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div class="form-control flex-1 min-w-64">
                            <div class="input-group">
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    class="input input-bordered w-full"
                                    value={filters.search}
                                    onInput$={(e) => {
                                        filters.search = (e.target as HTMLInputElement).value;
                                    }}
                                />
                                {filters.search && (
                                    <button
                                        class="btn btn-ghost"
                                        onClick$={() => (filters.search = '')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div class="form-control">
                            <select
                                class="select select-bordered"
                                value={filters.role || ''}
                                onChange$={(e) => {
                                    const value = (e.target as HTMLSelectElement).value;
                                    filters.role = value ? (value as StaffRole) : undefined;
                                }}
                            >
                                <option value="">All Roles</option>
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {staffRoleLabels[role]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div class="form-control">
                            <select
                                class="select select-bordered"
                                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                                onChange$={(e) => {
                                    const value = (e.target as HTMLSelectElement).value;
                                    filters.is_active = value === '' ? undefined : value === 'true';
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff List */}
            {filteredStaff.length === 0 ? (
                <div class="card bg-base-100 shadow">
                    <div class="card-body items-center text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 class="text-lg font-semibold">
                            {staffMembers.value.length === 0
                                ? 'No Staff Members'
                                : 'No Results Found'}
                        </h3>
                        <p class="text-base-content/70">
                            {staffMembers.value.length === 0
                                ? 'Add your first team member to get started.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                        {staffMembers.value.length === 0 && (
                            <a href="/vendor/staff/new" class="btn btn-primary mt-4">
                                Add Your First Staff Member
                            </a>
                        )}
                    </div>
                </div>
            ) : (
                <div class="overflow-x-auto">
                    <table class="table bg-base-100 shadow rounded-box">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map((staff) => (
                                <tr key={staff.id} class="hover">
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="avatar placeholder">
                                                <div class="bg-neutral text-neutral-content rounded-full w-10">
                                                    <span class="text-lg">
                                                        {staff.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <a
                                                    href={`/vendor/staff/${staff.id}`}
                                                    class="font-semibold hover:text-primary"
                                                >
                                                    {staff.name}
                                                </a>
                                                <div class="text-sm text-base-content/70">{staff.email}</div>
                                                {staff.phone && (
                                                    <div class="text-xs text-base-content/50">{staff.phone}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class={`badge ${staffRoleColors[staff.role]}`}>
                                            {staffRoleLabels[staff.role]}
                                        </span>
                                    </td>
                                    <td>
                                        {staff.invite_sent_at && !staff.invite_accepted_at ? (
                                            <div>
                                                <span class="badge badge-warning badge-sm">Pending Invite</span>
                                                <div class="text-xs text-base-content/50 mt-1">
                                                    Sent {formatDate(staff.invite_sent_at)}
                                                </div>
                                            </div>
                                        ) : (
                                            <span class={`badge ${staff.is_active ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                                                {staff.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div class="text-sm">{getRelativeTime(staff.last_active_at)}</div>
                                    </td>
                                    <td>
                                        <div class="dropdown dropdown-end">
                                            <label tabIndex={0} class="btn btn-ghost btn-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </label>
                                            <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                <li>
                                                    <a href={`/vendor/staff/${staff.id}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View Details
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href={`/vendor/staff/${staff.id}?edit=true`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </a>
                                                </li>
                                                <li>
                                                    <Form action={toggleStatusAction}>
                                                        <input type="hidden" name="id" value={staff.id} />
                                                        <input type="hidden" name="new_status" value={String(!staff.is_active)} />
                                                        <button type="submit" class="w-full text-left">
                                                            {staff.is_active ? (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                    </svg>
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Activate
                                                                </>
                                                            )}
                                                        </button>
                                                    </Form>
                                                </li>
                                                {staff.invite_sent_at && !staff.invite_accepted_at && (
                                                    <li>
                                                        <button>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            Resend Invite
                                                        </button>
                                                    </li>
                                                )}
                                                <li>
                                                    <button
                                                        class="text-error"
                                                        onClick$={() => {
                                                            staffToDelete.value = staff;
                                                            showDeleteConfirm.value = true;
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.value && staffToDelete.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Remove Staff Member</h3>
                        <p class="py-4">
                            Are you sure you want to remove <strong>{staffToDelete.value.name}</strong> from your team?
                            This action cannot be undone.
                        </p>
                        <div class="modal-action">
                            <button
                                class="btn btn-ghost"
                                onClick$={() => {
                                    showDeleteConfirm.value = false;
                                    staffToDelete.value = null;
                                }}
                            >
                                Cancel
                            </button>
                            <Form action={deleteAction}>
                                <input type="hidden" name="id" value={staffToDelete.value.id} />
                                <button
                                    type="submit"
                                    class="btn btn-error"
                                    onClick$={() => {
                                        showDeleteConfirm.value = false;
                                        staffToDelete.value = null;
                                    }}
                                >
                                    Remove
                                </button>
                            </Form>
                        </div>
                    </div>
                    <div
                        class="modal-backdrop"
                        onClick$={() => {
                            showDeleteConfirm.value = false;
                            staffToDelete.value = null;
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
});
