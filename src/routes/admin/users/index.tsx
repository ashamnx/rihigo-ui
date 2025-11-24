import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, routeAction$, Form } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse, PaginatedResponse } from "~/types/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  nationality?: string;
  created_at: string;
  preferences?: {
    currency?: string;
    language?: string;
    notifications?: boolean;
  };
}

interface UsersData {
  users: User[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export const useUsers = routeLoader$<ApiResponse<UsersData>>(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
    const role = requestEvent.url.searchParams.get('role') || undefined;

    let url = `/api/admin/users?page=${page}&page_size=20`;
    if (role) {
      url += `&role=${role}`;
    }

    return await apiClient.users.list(page, 20, token);
  });
});

export const useUpdateUserRole = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const userId = data.user_id as string;
    const role = data.role as 'user' | 'admin';

    return await apiClient.users.update(userId, { role }, token);
  });
});

export const useDeleteUser = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const userId = data.user_id as string;
    return await apiClient.users.delete(userId, token);
  });
});

export default component$(() => {
  const usersResponse = useUsers();
  const updateRoleAction = useUpdateUserRole();
  const deleteAction = useDeleteUser();

  const filterRole = useSignal<string>('all');
  const searchTerm = useSignal<string>('');
  const selectedUser = useSignal<User | null>(null);
  const showRoleModal = useSignal(false);
  const showDeleteModal = useSignal(false);

  const usersData = usersResponse.value.data;
  const paginationData = usersResponse.value.pagination_data;
  const users = usersData || [];
  const pagination = usersData ? {
    page: paginationData?.page,
    page_size: paginationData?.page_size,
    total: paginationData?.total_count,
    total_pages: paginationData?.total_pages
  } : null;

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesRole = filterRole.value === 'all' || user.role === filterRole.value;
    const matchesSearch = searchTerm.value === '' ||
      user.email.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.value.toLowerCase());

    return matchesRole && matchesSearch;
  });

  const openRoleModal = $((user: User) => {
    selectedUser.value = user;
    showRoleModal.value = true;
  });

  const closeRoleModal = $(() => {
    selectedUser.value = null;
    showRoleModal.value = false;
  });

  const openDeleteModal = $((user: User) => {
    selectedUser.value = user;
    showDeleteModal.value = true;
  });

  const closeDeleteModal = $(() => {
    selectedUser.value = null;
    showDeleteModal.value = false;
  });

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'badge-error' : 'badge-info';
  };

  const totalUsers = users?.length;
  const adminUsers = users?.filter((u: User) => u.role === 'admin').length;
  const regularUsers = users?.filter((u: User) => u.role === 'user').length;

  return (
    <div>
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Users Management</h1>
          <p class="text-sm text-base-content/70 mt-1">
            View and manage platform users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Total Users</div>
          <div class="stat-value text-primary">{totalUsers}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Regular Users</div>
          <div class="stat-value text-info">{regularUsers}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Administrators</div>
          <div class="stat-value text-error">{adminUsers}</div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-base-100 rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="form-control flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              class="input input-bordered"
              value={searchTerm.value}
              onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button
              class={`btn btn-sm ${filterRole.value === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterRole.value = 'all'}
            >
              All
            </button>
            <button
              class={`btn btn-sm ${filterRole.value === 'user' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterRole.value = 'user'}
            >
              Users
            </button>
            <button
              class={`btn btn-sm ${filterRole.value === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterRole.value = 'admin'}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateRoleAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User role updated successfully</span>
        </div>
      )}

      {updateRoleAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateRoleAction.value.error_message || 'Failed to update user role'}</span>
        </div>
      )}

      {deleteAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User deleted successfully</span>
        </div>
      )}

      {deleteAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteAction.value.error_message || 'Failed to delete user'}</span>
        </div>
      )}

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div class="bg-base-100 rounded-lg shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">No users found</h3>
          <p class="text-base-content/70">
            {searchTerm.value || filterRole.value !== 'all'
              ? 'Try adjusting your filters'
              : 'No users have been registered yet'}
          </p>
        </div>
      ) : (
        <div class="bg-base-100 rounded-lg shadow overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Nationality</th>
                <th>Preferences</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: User) => {
                const joinedDate = new Date(user.created_at);

                return (
                  <tr key={user.id}>
                    <td>
                      <div class="font-mono text-xs">{user.id.substring(0, 8)}...</div>
                    </td>
                    <td>
                      <div class="font-semibold">{user.name || 'N/A'}</div>
                    </td>
                    <td>
                      <div class="text-sm">{user.email}</div>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div class="text-sm">{user.phone || '-'}</div>
                    </td>
                    <td>
                      <div class="text-sm">{user.nationality || '-'}</div>
                    </td>
                    <td>
                      <div class="text-xs">
                        {user.preferences ? (
                          <div>
                            <div>{user.preferences.language || 'en'} / {user.preferences.currency || 'USD'}</div>
                            {user.preferences.notifications !== undefined && (
                              <div class="text-base-content/70">
                                Notifications: {user.preferences.notifications ? 'On' : 'Off'}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </div>
                    </td>
                    <td>
                      <div class="text-xs">
                        {joinedDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          onClick$={() => openRoleModal(user)}
                          title="Change role"
                        >
                          Role
                        </button>
                        <Link
                          href={`/admin/users/${user.id}`}
                          class="btn btn-xs btn-ghost"
                          title="View details"
                        >
                          View
                        </Link>
                        <button
                          class="btn btn-xs btn-ghost text-error"
                          onClick$={() => openDeleteModal(user)}
                          title="Delete user"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages && pagination.total_pages > 1 && (
        <div class="mt-6 flex justify-center">
          <div class="join">
            {Array.from({length: pagination.total_pages}, (_, i) => i + 1).map(page => (
              <a
                key={page}
                href={`/admin/users?page=${page}`}
                class={`join-item btn ${page === pagination.page ? 'btn-active' : ''}`}
              >
                {page}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal.value && selectedUser.value && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Update User Role</h3>

            <div class="mb-4">
              <p class="text-sm text-base-content/70 mb-2">
                User: <span class="font-semibold">{selectedUser.value.name}</span>
              </p>
              <p class="text-sm text-base-content/70">
                Email: <span class="font-mono">{selectedUser.value.email}</span>
              </p>
            </div>

            <Form action={updateRoleAction} onSubmitCompleted$={closeRoleModal}>
              <input type="hidden" name="user_id" value={selectedUser.value.id} />

              <div class="form-control mb-6">
                <label class="label">
                  <span class="label-text">User Role</span>
                </label>
                <select name="role" class="select select-bordered" required>
                  <option value="user" selected={selectedUser.value.role === 'user'}>User</option>
                  <option value="admin" selected={selectedUser.value.role === 'admin'}>Admin</option>
                </select>
                <label class="label">
                  <span class="label-text-alt text-warning">
                    Warning: Changing to admin grants full platform access
                  </span>
                </label>
              </div>

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeRoleModal}>Cancel</button>
                <button type="submit" class="btn btn-primary">Update Role</button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop" onClick$={closeRoleModal}></div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.value && selectedUser.value && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Delete User</h3>

            <div class="mb-4">
              <p class="text-sm text-base-content/70 mb-2">
                Are you sure you want to delete this user?
              </p>
              <p class="text-sm font-semibold mb-1">
                {selectedUser.value.name}
              </p>
              <p class="text-sm text-base-content/70 font-mono">
                {selectedUser.value.email}
              </p>
            </div>

            <div class="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>This action cannot be undone. All user data and bookings will be affected.</span>
            </div>

            <Form action={deleteAction} onSubmitCompleted$={closeDeleteModal}>
              <input type="hidden" name="user_id" value={selectedUser.value.id} />

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeDeleteModal}>Cancel</button>
                <button type="submit" class="btn btn-error">Delete User</button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop" onClick$={closeDeleteModal}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Users Management | Admin',
  meta: [
    {
      name: 'description',
      content: 'Manage platform users',
    },
  ],
};
