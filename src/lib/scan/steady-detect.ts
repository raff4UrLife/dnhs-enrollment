// src/lib/scan/steady-detect.ts
// Decides when a document in the camera's guide frame is bright, still, and sharp
// long enough to auto-capture. No external libraries.

// Region of the video frame to inspect, as fractions (0 to 1) of the full frame.
export type FrameRegion = { x: number; y: number; w: number; h: number };

export type SteadyStatus = "dark" | "moving" | "blurry" | "steady";

export type SteadyMetrics = {
  brightness: number; // 0-255, average
  sharpness: number; // edge detail; higher = sharper
  motion: number; // 0-255, change since the last check; lower = stiller
};

export type SteadyResult = {
  status: SteadyStatus;
  progress: number; // 0 to 1: how far through the hold time
  ready: boolean; // true once it has been steady for HOLD_MS
  metrics: SteadyMetrics;
};

// Tunable. Test on a real phone and adjust using the metrics.
const SAMPLE_WIDTH = 320; // frames are shrunk to this width before checking
const MIN_BRIGHTNESS = 70;
const MIN_SHARPNESS = 40;
const MAX_MOTION = 8;
const HOLD_MS = 1000; // must stay steady this long before capturing

export function createSteadyDetector(region: FrameRegion) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let previous: Uint8Array | null = null;
  let steadySince: number | null = null;
  let done = false;

  function reset() {
    previous = null;
    steadySince = null;
    done = false;
  }

  // Call about every 150 ms while the camera is on.
  // Returns null if the video is not ready yet.
  function check(
    video: HTMLVideoElement,
    now: number = performance.now(),
  ): SteadyResult | null {
    if (!ctx || video.readyState < 2 || !video.videoWidth) return null;

    if (done) {
      return {
        status: "steady",
        progress: 1,
        ready: true,
        metrics: { brightness: 0, sharpness: 0, motion: 0 },
      };
    }

    // Crop to the guide frame and shrink
    const sx = region.x * video.videoWidth;
    const sy = region.y * video.videoHeight;
    const sw = region.w * video.videoWidth;
    const sh = region.h * video.videoHeight;
    const W = SAMPLE_WIDTH;
    const H = Math.max(8, Math.round((SAMPLE_WIDTH * sh) / sw));

    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
      previous = null;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
    const rgba = ctx.getImageData(0, 0, W, H).data;

    // Grayscale + brightness
    const gray = new Uint8Array(W * H);
    let brightSum = 0;
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      const g = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
      gray[i] = g;
      brightSum += g;
    }
    const brightness = brightSum / gray.length;

    // Sharpness: variance of the Laplacian (edge detail)
    let lapSum = 0;
    let lapSumSq = 0;
    let count = 0;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        const lap =
          4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - W] - gray[i + W];
        lapSum += lap;
        lapSumSq += lap * lap;
        count++;
      }
    }
    const lapMean = lapSum / count;
    const sharpness = lapSumSq / count - lapMean * lapMean;

    // Motion: average pixel change since the last check
    let motion = 255;
    if (previous && previous.length === gray.length) {
      let diff = 0;
      for (let i = 0; i < gray.length; i++) {
        diff += Math.abs(gray[i] - previous[i]);
      }
      motion = diff / gray.length;
    }
    previous = gray;

    const metrics: SteadyMetrics = { brightness, sharpness, motion };

    // Work out status. Order matters: if it is moving, blur is expected.
    let status: SteadyStatus;
    if (brightness < MIN_BRIGHTNESS) status = "dark";
    else if (motion > MAX_MOTION) status = "moving";
    else if (sharpness < MIN_SHARPNESS) status = "blurry";
    else status = "steady";

    if (status !== "steady") {
      steadySince = null;
      return { status, progress: 0, ready: false, metrics };
    }

    if (steadySince === null) steadySince = now;
    const progress = Math.min(1, (now - steadySince) / HOLD_MS);
    if (progress >= 1) done = true;

    return { status, progress, ready: done, metrics };
  }

  return { check, reset };
}
