import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { getTaxRules, createTaxRule, updateTaxRule, deleteTaxRule } from '~/services/tax-api';
import type { TaxRule } from '~/types/tax';

export const useTaxRules = routeLoader$(async (requestEvent) => {
    const session = requestEvent.sharedMap.get('session');
    if (!session || !session.user) {
        return { success: false, data: [], error: 'Unauthorized' };
    }
    try {
        const response = await getTaxRules(session.user.accessToken);
        return response;
    } catch (error) {
        return { success: false, data: [], error: 'Failed to load tax rules' };
    }
});

export const useCreateTaxRule = routeAction$(async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get('session');
    if (!session || !session.user) return { success: false, message: 'Unauthorized' };
    try {
        const payload: any = {
            name: data.name,
            rate: parseFloat(data.rate as string),
            type: data.type,
        };
        if (data.booking_type && data.booking_type !== '') {
            payload.booking_type = data.booking_type;
        }
        await createTaxRule(payload, session.user.accessToken);
        return { success: true, message: 'Tax rule created successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to create tax rule' };
    }
});

export const useUpdateTaxRule = routeAction$(async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get('session');
    if (!session || !session.user) return { success: false, message: 'Unauthorized' };
    try {
        const payload: any = {
            name: data.name,
            rate: parseFloat(data.rate as string),
            type: data.type,
        };
        if (data.booking_type && data.booking_type !== '') {
            payload.booking_type = data.booking_type;
        }
        await updateTaxRule(data.id as string, payload, session.user.accessToken);
        return { success: true, message: 'Tax rule updated successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to update tax rule' };
    }
});

export const useDeleteTaxRule = routeAction$(async (data, requestEvent) => {
    const session = requestEvent.sharedMap.get('session');
    if (!session || !session.user) return { success: false, message: 'Unauthorized' };
    try {
        await deleteTaxRule(data.id as string, session.user.accessToken);
        return { success: true, message: 'Tax rule deleted successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to delete tax rule' };
    }
});

export default component$(() => {
    const taxRulesData = useTaxRules();
    const createAction = useCreateTaxRule();
    const updateAction = useUpdateTaxRule();
    const deleteAction = useDeleteTaxRule();

    const showModal = useSignal(false);
    const isEditing = useSignal(false);
    const selectedRule = useStore<Partial<TaxRule>>({});

    const openCreateModal = $(() => {
        isEditing.value = false;
        Object.assign(selectedRule, {
            name: '',
            rate: 0,
            type: 'percentage',
            booking_type: '',
        });
        showModal.value = true;
    });

    const openEditModal = $((rule: TaxRule) => {
        isEditing.value = true;
        Object.assign(selectedRule, rule);
        showModal.value = true;
    });

    const closeModal = $(() => {
        showModal.value = false;
    });

    return (
        <div>
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Tax Rules</h1>
                    <p class="text-sm text-base-content/70 mt-1">Manage tax configurations</p>
                </div>
                <button class="btn btn-primary" onClick$={openCreateModal}>
                    Add Tax Rule
                </button>
            </div>

            {(createAction.value?.success || updateAction.value?.success || deleteAction.value?.success) && (
                <div class="alert alert-success mb-4">
                    <span>{createAction.value?.message || updateAction.value?.message || deleteAction.value?.message}</span>
                </div>
            )}

            <div class="bg-base-100 rounded-lg shadow overflow-x-auto">
                <table class="table table-zebra">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Rate</th>
                            <th>Booking Type</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxRulesData.value.data.map((rule: TaxRule) => (
                            <tr key={rule.id}>
                                <td>
                                    <div class="font-bold">{rule.name}</div>
                                </td>
                                <td>
                                    <span class="capitalize">{rule.type.replace('_', ' ')}</span>
                                </td>
                                <td>
                                    {rule.type === 'percentage' ? `${rule.rate}%` : `$${rule.rate}`}
                                </td>
                                <td>
                                    {rule.booking_type ? (
                                        <span class="badge badge-outline">{rule.booking_type}</span>
                                    ) : (
                                        <span class="text-xs opacity-50">All types</span>
                                    )}
                                </td>
                                <td>
                                    <span class={`badge ${rule.is_active ? 'badge-success' : 'badge-ghost'}`}>
                                        {rule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>{new Date(rule.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <button class="btn btn-xs btn-outline" onClick$={() => openEditModal(rule)}>Edit</button>
                                        <Form action={deleteAction}>
                                            <input type="hidden" name="id" value={rule.id} />
                                            <button class="btn btn-xs btn-error btn-outline">Delete</button>
                                        </Form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg mb-4">{isEditing.value ? 'Edit Tax Rule' : 'New Tax Rule'}</h3>
                        <Form onSubmit$={() => {
                            return isEditing.value ? updateAction : createAction
                        }} onSubmitCompleted$={closeModal}>
                            {isEditing.value && <input type="hidden" name="id" value={selectedRule.id} />}

                            <div class="form-control w-full mb-4">
                                <label class="label"><span class="label-text">Name</span></label>
                                <input type="text" name="name" value={selectedRule.name} class="input input-bordered w-full" required />
                            </div>

                            <div class="flex gap-4 mb-4">
                                <div class="form-control w-1/2">
                                    <label class="label"><span class="label-text">Type</span></label>
                                    <select name="type" value={selectedRule.type} class="select select-bordered w-full">
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed_per_person">Fixed per Person</option>
                                    </select>
                                </div>
                                <div class="form-control w-1/2">
                                    <label class="label"><span class="label-text">Rate</span></label>
                                    <input type="number" step="0.01" name="rate" value={selectedRule.rate} class="input input-bordered w-full" required />
                                </div>
                            </div>

                            <div class="form-control w-full mb-4">
                                <label class="label">
                                    <span class="label-text">Booking Type</span>
                                    <span class="label-text-alt text-xs opacity-50">Optional - leave empty for all types</span>
                                </label>
                                <input type="text" name="booking_type" value={selectedRule.booking_type} class="input input-bordered w-full" placeholder="e.g., diving, surfing" />
                            </div>

                            <div class="modal-action">
                                <button type="button" class="btn" onClick$={closeModal}>Cancel</button>
                                <button type="submit" class="btn btn-primary">Save</button>
                            </div>
                        </Form>
                    </div>
                    <div class="modal-backdrop" onClick$={closeModal}></div>
                </div>
            )}
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Tax Rules | Admin',
};
