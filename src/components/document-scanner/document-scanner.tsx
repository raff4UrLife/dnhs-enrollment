// src/components/document-scanner/document-scanner.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { canvasToPdfFile } from "@/lib/scan/image-to-pdf";
import {
  createSteadyDetector,
  type FrameRegion,
  type SteadyResult,
  type SteadyStatus,
} from "@/lib/scan/steady-detect";

type Phase = "starting" | "live" | "captured" | "error";

type Props = {
  label: string; // e.g. "PSA Birth Certificate"
  fileName?: string; // name of the PDF produced
  onCapture: (file: File) => void; // receives the finished PDF
  onClose: () => void;
  debug?: boolean; // shows live numbers for tuning thresholds
};

const CHECK_EVERY_MS = 150;
const MANUAL_AFTER_MS = 8000; // show a fallback capture link if auto-capture stalls
const FRAME_ASPECT = 1.414; // guide frame height / width (A4 portrait)
const FRAME_FILL = 0.9; // guide frame fills up to 90% of the video

const MESSAGES: Record<SteadyStatus, string> = {
  dark: "Needs more light",
  moving: "Hold still",
  blurry: "Move closer or farther until the text is sharp",
  steady: "Hold still… capturing",
};

// Largest A4-shaped frame that fits inside the video, as fractions of the video
function computeRegion(vw: number, vh: number): FrameRegion {
  const boxW = FRAME_FILL * vw;
  const boxH = FRAME_FILL * vh;
  let w = boxW;
  let h = w * FRAME_ASPECT;
  if (h > boxH) {
    h = boxH;
    w = h / FRAME_ASPECT;
  }
  return {
    x: (vw - w) / 2 / vw,
    y: (vh - h) / 2 / vh,
    w: w / vw,
    h: h / vh,
  };
}

function cameraErrorMessage(err: unknown): string {
  if (typeof navigator !== "undefined" && !navigator.mediaDevices) {
    return "The camera needs a secure (HTTPS) connection.";
  }
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError")
    return "Camera access was blocked. Allow the camera in your browser settings, then try again.";
  if (name === "NotFoundError") return "No camera was found on this device.";
  if (name === "NotReadableError")
    return "The camera is being used by another app.";
  return "Could not start the camera.";
}

export default function DocumentScanner({
  label,
  fileName = "scan.pdf",
  onCapture,
  onClose,
  debug = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startIdRef = useRef(0);
  const detectorRef = useRef<ReturnType<typeof createSteadyDetector> | null>(
    null,
  );
  const regionRef = useRef<FrameRegion | null>(null);
  const capturedRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [region, setRegion] = useState<FrameRegion | null>(null);
  const [result, setResult] = useState<SteadyResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Opens the camera. State is only set after the camera answers (not on call),
  // so it is safe to call from an effect. Use restart() from buttons.
  const startCamera = useCallback(async () => {
    const id = startIdRef.current + 1;
    startIdRef.current = id;

    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("no-camera-api");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (id !== startIdRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const el = videoRef.current;
      if (!el) return;
      el.srcObject = stream;
      await el.play();
      if (id !== startIdRef.current) return;

      const vw = el.videoWidth;
      const vh = el.videoHeight;
      if (!vw || !vh) throw new Error("no-video");

      const r = computeRegion(vw, vh);
      regionRef.current = r;
      detectorRef.current = createSteadyDetector(r);
      setVideoSize({ w: vw, h: vh });
      setRegion(r);
      setPhase("live");
    } catch (err) {
      if (id !== startIdRef.current) return;
      setError(cameraErrorMessage(err));
      setPhase("error");
    }
  }, []);

  // Reset the screen, then open the camera again (Retake / Try again buttons)
  function restart() {
    capturedRef.current = null;
    setPreview(null);
    setError(null);
    setResult(null);
    setShowManual(false);
    setPhase("starting");
    startCamera();
  }

  // Grab the guide-frame area at full camera resolution
  const capture = useCallback(() => {
    const el = videoRef.current;
    const r = regionRef.current;
    if (!el || !r || capturedRef.current) return;

    const sx = r.x * el.videoWidth;
    const sy = r.y * el.videoHeight;
    const sw = r.w * el.videoWidth;
    const sh = r.h * el.videoHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    capturedRef.current = canvas;
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setPhase("captured");
  }, [stopCamera]);

  // Start the camera on open, stop it on close
  useEffect(() => {
    startCamera();
    return () => {
      startIdRef.current = startIdRef.current + 1;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Close with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Check the camera frame while live
  useEffect(() => {
    if (phase !== "live") return;
    const el = videoRef.current;
    const detector = detectorRef.current;
    if (!el || !detector) return;

    const timer = setInterval(() => {
      const r = detector.check(el);
      if (!r) return;
      setResult(r);
      if (r.ready) capture();
    }, CHECK_EVERY_MS);
    const manualTimer = setTimeout(() => setShowManual(true), MANUAL_AFTER_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(manualTimer);
    };
  }, [phase, capture]);

  async function useScan() {
    const canvas = capturedRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    setError(null);
    try {
      const file = await canvasToPdfFile(canvas, fileName);
      onCapture(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the scan.");
    } finally {
      setSaving(false);
    }
  }

  const steady = result?.status === "steady";
  const statusText =
    phase === "starting"
      ? "Starting camera…"
      : result
        ? MESSAGES[result.status]
        : "Fit the whole document inside the frame";

  const cameraClass =
    phase === "live"
      ? "relative overflow-hidden"
      : phase === "starting"
        ? "invisible relative overflow-hidden"
        : "hidden";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Scan ${label}`}
      className="fixed inset-0 z-50 bg-black text-white"
    >
      {/* Camera / preview area */}
      <div
        className="absolute inset-0 flex items-center justify-center px-2 pt-16 pb-36"
        style={{ containerType: "size" }}
      >
        <div
          className={cameraClass}
          style={{
            aspectRatio: videoSize
              ? `${videoSize.w} / ${videoSize.h}`
              : "16 / 9",
            width: videoSize
              ? `min(100cqw, calc(100cqh * ${videoSize.w / videoSize.h}))`
              : "100cqw",
          }}
        >
          <video ref={videoRef} playsInline muted className="h-full w-full" />
          {region && (
            <div
              className={`absolute rounded-lg border-2 transition-colors ${
                steady ? "border-green-400" : "border-white/90"
              }`}
              style={{
                left: `${region.x * 100}%`,
                top: `${region.y * 100}%`,
                width: `${region.w * 100}%`,
                height: `${region.h * 100}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              }}
            />
          )}
        </div>

        {phase === "captured" && preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Scanned document"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-black/70 to-transparent p-4">
        <p className="text-sm font-medium">Scan: {label}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scanner"
          className="rounded-full bg-white/15 p-2 hover:bg-white/25"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 space-y-3 bg-linear-to-b from-black/80 to-transparent p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        {phase === "error" && (
          <>
            <p className="text-sm text-red-300">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white/15 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}

        {(phase === "starting" || phase === "live") && (
          <>
            <p className="text-sm">{statusText}</p>
            {phase === "live" && (
              <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-green-400 transition-[width] duration-150"
                  style={{
                    width: `${Math.round((result?.progress ?? 0) * 100)}%`,
                  }}
                />
              </div>
            )}
            {phase === "live" && showManual && (
              <button
                type="button"
                onClick={capture}
                className="text-sm text-white/80 underline underline-offset-4"
              >
                Not capturing? Capture now
              </button>
            )}
            {debug && result && (
              <p className="text-xs tabular-nums text-white/60">
                brightness {Math.round(result.metrics.brightness)} · sharpness{" "}
                {Math.round(result.metrics.sharpness)} · motion{" "}
                {result.metrics.motion.toFixed(1)}
              </p>
            )}
          </>
        )}

        {phase === "captured" && (
          <>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={restart}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm disabled:opacity-50"
              >
                <RotateCcw className="size-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={useScan}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Use this scan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
