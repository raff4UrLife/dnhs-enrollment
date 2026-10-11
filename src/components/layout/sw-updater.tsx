// src/components/layout/sw-updater.tsx
"use client";

import { useEffect } from "react";

// Pages where a surprise reload would wipe unsaved work.
// The new version simply loads the next time the page is opened.
const NO_RELOAD_PATHS = [
  "/offline-walk-in",
  "/enrollment-form",
  "/admin/applications/new",
];

export function SwUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;

    // A page with no controller yet is a first install, which must not reload
    let hadController = !!sw.controller;
    let reloaded = false;

    function onControllerChange() {
      if (!hadController) {
        hadController = true;
        return;
      }
      if (reloaded) return;
      const path = window.location.pathname;
      if (NO_RELOAD_PATHS.some((p) => path.startsWith(p))) return;
      reloaded = true;
      window.location.reload();
    }

    // Ask the browser to look for a new sw.js when the app returns to the foreground
    function checkForUpdate() {
      if (document.visibilityState !== "visible") return;
      sw.getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {
          // offline or blocked: try again next time
        });
    }

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("online", checkForUpdate);

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);

  return null;
}
