// src/components/enrollment/step-5-documents.tsx
"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useReference } from "@/lib/enrollment/reference-context";
import { Camera, FileText, ScanLine, Upload, User } from "lucide-react";
import type {
  ApplicationFormData,
  ApplicationFiles,
  DocumentType,
} from "@/lib/enrollment/types";
import { IMAGE_TYPES, validateFile } from "@/lib/enrollment/validate-file";
import { compressImage } from "@/lib/enrollment/compress-image";
import { CameraCapture } from "@/components/enrollment/camera-capture";
import DocumentScanner from "@/components/document-scanner/document-scanner";
import { Button } from "@/components/ui/button";

interface StepProps {
  files: ApplicationFiles;
  onChange: (patch: Partial<ApplicationFiles>) => void;
  data: ApplicationFormData;
  onDataChange: (patch: Partial<ApplicationFormData>) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SCAN_BYTES = 1024 * 1024; // 1 MB per file for public applicants

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Our scanner writes each PDF as one page holding one JPEG. This reads that
// JPEG back out so the slot can show a real preview. Returns null if the PDF
// was not made by our scanner.
async function extractScanImage(file: File): Promise<Blob | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  // The JPEG starts at the first FF D8 FF (the PDF header before it is plain text)
  let start = -1;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  // It ends right before the last "endstream" in the file
  const marker = new TextEncoder().encode("endstream");
  let markerAt = -1;
  for (let i = bytes.length - marker.length; i > start; i--) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (bytes[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      markerAt = i;
      break;
    }
  }
  if (markerAt < 0) return null;

  const jpeg = bytes.slice(start, markerAt - 1); // skip the newline before "endstream"
  const looksValid =
    jpeg.length > 4 &&
    jpeg[jpeg.length - 2] === 0xff &&
    jpeg[jpeg.length - 1] === 0xd9;
  if (!looksValid) return null;

  return new Blob([jpeg], { type: "image/jpeg" });
}

export function getStep6Errors(
  files: ApplicationFiles,
  data: ApplicationFormData,
  documentTypes: DocumentType[],
) {
  const errors: Record<string, string> = {};
  if (data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  for (const d of documentTypes) {
    if (d.required && !files.documents[d.id]) {
      errors[d.id] = `${d.name} is required.`;
    }
  }
  return errors;
}

export function isStep6Valid(
  files: ApplicationFiles,
  data: ApplicationFormData,
  documentTypes: DocumentType[],
) {
  return Object.keys(getStep6Errors(files, data, documentTypes)).length === 0;
}

export function Step5Documents({
  files,
  onChange,
  data,
  onDataChange,
}: StepProps) {
  const { documentTypes } = useReference();
  const [pickErrors, setPickErrors] = useState<Record<string, string>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState<
    Record<string, string>
  >({});
  // which slot is being scanned: "photo", a document id, or null (closed)
  const [scanTarget, setScanTarget] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const docInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const file = files.profile_picture;
    if (!file) return;

    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
    };
  }, [files.profile_picture]);

  // Document previews: picked images are read directly; scanned PDFs have
  // their embedded image pulled out first.
  useEffect(() => {
    let cancelled = false;

    for (const [id, file] of Object.entries(files.documents)) {
      if (!file) continue;

      (async () => {
        try {
          const source =
            file.type === "application/pdf"
              ? await extractScanImage(file)
              : file;
          if (!source || cancelled) return;
          const url = await readAsDataUrl(source);
          if (!cancelled) {
            setDocumentPreviewUrls((prev) => ({ ...prev, [id]: url }));
          }
        } catch {
          // no preview available; the slot falls back to the PDF label
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [files.documents]);

  // no file selected -> no preview (derived, so no setState needed)
  const preview = files.profile_picture ? photoUrl : null;

  async function pick(key: string, file: File | undefined, allowed: string[]) {
    if (!file) return;
    const err = validateFile(file, allowed);
    if (err) {
      setPickErrors((e) => ({ ...e, [key]: err }));
      return;
    }
    try {
      const compressed = await compressImage(file);
      setPickErrors((e) => ({ ...e, [key]: "" }));
      if (key === "photo") onChange({ profile_picture: compressed });
      else onChange({ documents: { ...files.documents, [key]: compressed } });
    } catch {
      setPickErrors((e) => ({
        ...e,
        [key]: "Could not process this image. Try another one.",
      }));
    }
  }

  // A scanned document arrives as a finished PDF (already sized by the scanner)
  function acceptScan(docId: string, file: File) {
    setScanTarget(null);
    if (file.size > MAX_SCAN_BYTES) {
      setPickErrors((e) => ({
        ...e,
        [docId]: "The scan is larger than 1 MB. Please scan again.",
      }));
      return;
    }
    setPickErrors((e) => ({ ...e, [docId]: "" }));
    onChange({ documents: { ...files.documents, [docId]: file } });
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>, key: string) {
    const file = e.target.files?.[0];
    e.target.value = "";
    pick(key, file, IMAGE_TYPES);
  }

  const emailError = getStep6Errors(files, data, documentTypes).email;
  const scanningDoc =
    scanTarget && scanTarget !== "photo"
      ? documentTypes.find((d) => d.id === scanTarget)
      : undefined;

  return (
    <div className="space-y-6">
      <p className="text-white/70">
        Upload a clear scan or photo of each document. You will still need to
        bring the originals to the school for verification.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-full rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
          <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
            Email (optional)
          </h3>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onDataChange({ email: e.target.value })}
            placeholder="name@example.com"
            className="mt-4 w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <p className="mt-2 text-xs text-white/50">
            We use this only to notify you about your application status.
          </p>
          {emailError && (
            <p className="mt-1 text-sm text-red-400">{emailError}</p>
          )}
        </div>

        <div className="h-full rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
          <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
            Profile Picture
          </h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-white/10">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-10 text-white/30" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                ref={photoInput}
                type="file"
                className="hidden"
                accept={IMAGE_TYPES.join(",")}
                onChange={(e) => handleFile(e, "photo")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-primary"
                onClick={() => photoInput.current?.click()}
              >
                <Upload className="size-4" />
                Choose file
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-primary"
                onClick={() => setScanTarget("photo")}
              >
                <Camera className="size-4" />
                Take a photo
              </Button>
              <p className="truncate text-xs text-white/50">
                {files.profile_picture?.name ?? "No file chosen"}
              </p>
            </div>
          </div>
          {pickErrors.photo && (
            <p className="mt-2 text-sm text-red-400">{pickErrors.photo}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Required Documents
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {documentTypes.map((d) => {
            const docFile = files.documents[d.id];
            const isPdf = docFile?.type === "application/pdf";
            const docPreview = docFile ? documentPreviewUrls[d.id] : undefined;
            return (
              <div
                key={d.id}
                className="flex flex-col rounded-md border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-medium text-white">{d.name}</p>
                <div className="relative mt-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/10">
                  {docPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={docPreview}
                        alt={`${d.name} preview`}
                        className="size-full object-contain"
                      />
                      {isPdf && (
                        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          PDF
                        </span>
                      )}
                    </>
                  ) : isPdf ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-white/70">
                      <FileText className="size-10" />
                      <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-medium">
                        PDF scan
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/30">
                      <ScanLine className="size-10" />
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => {
                    docInputs.current[d.id] = el;
                  }}
                  type="file"
                  className="hidden"
                  accept={IMAGE_TYPES.join(",")}
                  onChange={(e) => handleFile(e, d.id)}
                />
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-primary"
                    onClick={() => docInputs.current[d.id]?.click()}
                  >
                    <Upload className="size-4" />
                    Choose file
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-primary"
                    onClick={() => setScanTarget(d.id)}
                  >
                    <ScanLine className="size-4" />
                    Scan document
                  </Button>
                </div>
                <p className="mt-2 truncate text-xs text-white/50">
                  {docFile?.name ?? "No file chosen"}
                </p>
                {pickErrors[d.id] && (
                  <p className="mt-1 text-sm text-red-400">
                    {pickErrors[d.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile photo: existing camera capture */}
      <CameraCapture
        open={scanTarget === "photo"}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title="Take profile picture"
        facing="user"
        onCapture={(file) => pick("photo", file, IMAGE_TYPES)}
        mode="photo"
      />

      {/* Documents: live scanner, saved as PDF */}
      {scanningDoc && (
        <DocumentScanner
          label={scanningDoc.name}
          fileName={`${scanningDoc.name}.pdf`}
          onCapture={(file) => acceptScan(scanningDoc.id, file)}
          onClose={() => setScanTarget(null)}
          debug // remove after testing
        />
      )}
    </div>
  );
}
