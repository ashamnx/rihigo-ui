import {component$} from "@builder.io/qwik";
import {routeLoader$} from "@builder.io/qwik-city";
import {apiClient} from "~/utils/api-client";

/**
 * Example route loader that demonstrates how to use the API client
 */
export const useTestAPI = routeLoader$(async () => {
  try {
    // Test API health endpoint and activities
    const [healthResponse, activitiesResponse] = await Promise.all([
      apiClient.health(),
      apiClient.activities.list(1, 5)
    ]);

    return {
      success: true,
      data: {
        health: healthResponse,
        activities: activitiesResponse.success ? activitiesResponse.data : []
      },
      message: 'API test executed successfully'
    };
  } catch (error) {
    console.error('API test failed:', error);

    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Unknown API error'
    };
  }
});

/**
 * API test endpoint that returns the result of the API queries
 */
export default component$(() => {
  const apiTest = useTestAPI();

  return (
    <>
      <div>
        <h1>API Test</h1>
        <pre>{JSON.stringify(apiTest.value, null, 2)}</pre>
      </div>
    </>
  );
});
