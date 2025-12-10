/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Node.js server when building for production.
 *
 * Learn more about the Node.js server integration here:
 * - https://qwik.dev/docs/deployments/self-hosting/
 *
 */
import {
  createQwikCity,
  type PlatformNode,
} from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import { createServer } from "node:http";
import { join } from "node:path";

declare global {
  interface QwikCityPlatform extends PlatformNode {}
}

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Create the Qwik City node middleware
const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: {
    root: join(process.cwd(), "dist"),
  },
});

const server = createServer();

server.on("request", (req, res) => {
  staticFile(req, res, () => {
    router(req, res, () => {
      notFound(req, res, () => {});
    });
  });
});

server.listen(PORT, () => {
  console.log(`Node server listening on http://localhost:${PORT}`);
});
