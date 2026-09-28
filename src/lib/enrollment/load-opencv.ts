type CvWindow = Window & { cv?: { Mat?: unknown } };

let loadPromise: Promise<void> | null = null;

export function loadOpenCV(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const isReady = () => !!(window as CvWindow).cv?.Mat;

    if (isReady()) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/opencv.js";
    script.async = true;
    script.onerror = () => {
      loadPromise = null; // allow a retry later
      reject(new Error("Could not load the document scanner."));
    };
    document.body.appendChild(script);

    // OpenCV finishes starting up a moment after the file loads,
    // so check until its API (cv.Mat) exists.
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (isReady()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - startedAt > 30000) {
        clearInterval(timer);
        loadPromise = null;
        reject(new Error("The document scanner took too long to start."));
      }
    }, 100);
  });

  return loadPromise;
}
