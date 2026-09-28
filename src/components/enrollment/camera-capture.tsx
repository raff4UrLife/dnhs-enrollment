"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { scanDocument } from "@/lib/enrollment/scan-document";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  facing: "user" | "environment";
  mode: "photo" | "document";
  onCapture: (file: File) => void;
}

export function CameraCapture({
  open,
  onOpenChange,
  title,
  facing,
  mode,
  onCapture,
}: CameraCaptureProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <CameraView
            facing={facing}
            mode={mode}
            onCapture={onCapture}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CameraView({
  facing,
  mode,
  onCapture,
  onClose,
}: {
  facing: "user" | "environment";
  mode: "photo" | "document";
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const supported = !!navigator.mediaDevices?.getUserMedia;

  // start the camera, and always stop it when the dialog closes
  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() =>
        setError(
          "Could not open the camera. Allow camera access in your browser, or choose a file instead.",
        ),
      );

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, supported]);

  // free the preview URL when it is replaced or the dialog closes
  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    let file: File | null = null;
    if (mode === "document") {
      setBusy(true);
      setNotice(null);
      file = await scanDocument(canvas);
      setBusy(false);
      if (!file) {
        setNotice(
          "Could not detect the page edges, so the full photo was kept. Place the paper on a plain dark surface and retake for a cleaner crop.",
        );
      }
    }
    if (!file) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) return;
      file = new File([blob], "scan.jpg", { type: "image/jpeg" });
    }
    setShot({ file, url: URL.createObjectURL(file) });
  }

  const message =
    error ??
    (!supported
      ? "This browser cannot use the camera. Please choose a file instead."
      : null);

  return (
    <>
      <DialogBody>
        {message ? (
          <p className="text-sm text-red-400">{message}</p>
        ) : (
          <div className="overflow-hidden rounded-md bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className={shot ? "hidden" : "w-full"}
            />
            {shot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.url} alt="Captured" className="w-full" />
            )}
          </div>
        )}
        {notice && <p className="mt-2 text-sm text-primary">{notice}</p>}
      </DialogBody>

      <DialogFooter>
        {shot ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShot(null);
                setNotice(null);
              }}
            >
              Retake
            </Button>
            <Button
              onClick={() => {
                onCapture(shot.file);
                onClose();
              }}
            >
              Use photo
            </Button>
          </>
        ) : (
          <Button disabled={!!message || busy} onClick={capture}>
            {busy ? "Processing…" : "Capture"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
