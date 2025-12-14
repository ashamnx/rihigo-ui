import type { RequestHandler } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';

/**
 * BML Webhook Endpoint
 *
 * This endpoint receives server-to-server notifications from BML's payment gateway.
 * It forwards the payload to the backend API which handles signature verification
 * and payment status updates.
 *
 * POST /api/webhooks/bml
 */
export const onPost: RequestHandler = async ({ request, json }) => {
    try {
        const payload = await request.json();

        // Log webhook receipt for debugging (remove in production or use proper logging)
        console.log('BML webhook received:', JSON.stringify(payload, null, 2));

        // Forward to backend - backend handles signature verification
        const response = await apiClient.bmlPayments.forwardWebhook(payload);

        if (response.success) {
            json(200, { success: true, message: 'Webhook processed successfully' });
        } else {
            console.error('BML webhook processing failed:', response.error_message);
            json(500, {
                success: false,
                error: response.error_message || 'Webhook processing failed',
            });
        }
    } catch (error) {
        console.error('BML webhook error:', error);
        json(500, {
            success: false,
            error: 'Internal server error processing webhook',
        });
    }
};

/**
 * Handle preflight requests for CORS
 * BML may send OPTIONS request before POST
 */
export const onOptions: RequestHandler = async ({ headers }) => {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-BML-Signature');
};
