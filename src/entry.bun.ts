/// <reference types="@types/bun" />
/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Bun HTTP server when building for production.
 *
 * Learn more about the Bun integration here:
 * - https://qwik.dev/docs/deployments/bun/
 * - https://bun.sh/docs/api/http
 *
 */
import { createQwikCity } from "@builder.io/qwik-city/middleware/bun";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";

// Create the Qwik City Bun middleware
const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: {
    cacheControl: "public, max-age=31536000, immutable",
  },
});

// Allow for dynamic port
const port = Number(Bun.env.PORT ?? 3000);

// eslint-disable-next-line no-console
console.log(`Server started: http://localhost:${port}/`);

/**
 * Rewrite request URL to use the correct protocol from X-Forwarded-Proto header.
 * This is necessary when behind a reverse proxy (like Nginx) that terminates SSL.
 */
function getProxiedRequest(request: Request): Request {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (!forwardedProto) {
    return request;
  }

  const url = new URL(request.url);
  if (url.protocol !== `${forwardedProto}:`) {
    url.protocol = `${forwardedProto}:`;
    return new Request(url.toString(), request);
  }

  return request;
}

Bun.serve({
  async fetch(request: Request) {
    // Rewrite URL protocol based on X-Forwarded-Proto for correct OAuth redirects
    const proxiedRequest = getProxiedRequest(request);

    const staticResponse = await staticFile(proxiedRequest);
    if (staticResponse) {
      return staticResponse;
    }

    // Server-side render this request with Qwik City
    const qwikCityResponse = await router(proxiedRequest);
    if (qwikCityResponse) {
      return qwikCityResponse;
    }

    // Path not found
    return notFound(proxiedRequest);
  },
  port,
});
