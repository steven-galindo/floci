declare global {
  interface Window {
    __FLOCI_CONFIG__?: { endpoint: string }
  }
}

// Docker:   nginx entrypoint sets window.__FLOCI_CONFIG__.endpoint = window.location.origin + '/api'
//           nginx proxies /api/ → http://floci:4566/ internally.
// Dev:      Vite proxies /api/ → http://localhost:4566 (see vite.config.ts).
//           window.location.origin = http://localhost:5173 → works automatically.
export const FLOCI_ENDPOINT: string =
  window.__FLOCI_CONFIG__?.endpoint ||
  import.meta.env.VITE_FLOCI_ENDPOINT ||
  `${window.location.origin}/api`
