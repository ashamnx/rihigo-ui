import { component$ } from "@builder.io/qwik";
import type { ApiResponse } from "~/types/api";

interface ApiErrorAlertProps {
  response: ApiResponse;
  fallbackMessage?: string;
}

/**
 * Displays API error messages including field-level validation errors.
 * Works with the standard API response format: { success, error_message, errors }
 */
export const ApiErrorAlert = component$<ApiErrorAlertProps>(
  ({ response, fallbackMessage = "An error occurred" }) => {
    if (response.success !== false) {
      return null;
    }

    const errors = response.errors;
    const hasErrors = Array.isArray(errors) && errors.length > 0;

    return (
      <div class="alert alert-error mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p>{response.error_message || fallbackMessage}</p>
          {hasErrors && (
            <ul class="mt-2 text-sm list-disc list-inside">
              {(errors as any[]).map((err: any) => (
                <li key={typeof err === "string" ? err : err.field}>
                  {typeof err === "string" ? err : err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
);
