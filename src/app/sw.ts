// src/app/sw.ts
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

// Tells TypeScript about the list Serwist fills in at build time
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

// Only PUBLIC static files are cached. There is deliberately no rule for /admin, /auth or /api,
// so signed-in pages and data always come from the network and are never stored on the device.
const runtimeCaching: RuntimeCaching[] = [
  {
    // App code, styles and fonts. File names change on every build, so cache-first is safe.
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * DAY }),
      ],
    }),
  },
  {
    // School logo, gate photo and app icons: show the saved copy, refresh it in the background
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      (url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/_next/image")),
    handler: new StaleWhileRevalidate({
      cacheName: "public-images",
      plugins: [
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * DAY }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        // When a page can't load because there is no internet, show the offline page
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
