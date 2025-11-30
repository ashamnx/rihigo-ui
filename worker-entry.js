// Workers entry wrapper for Qwik's Cloudflare Pages adapter
// This re-exports the fetch handler as a default export for Workers compatibility
import { fetch } from "./server/entry.cloudflare-pages.js";

export default { fetch };
