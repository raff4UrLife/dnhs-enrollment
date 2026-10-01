// src/components/enrollment/step-5-documents.tsx
"use client";

import { useEffect, useState } from "react";
import { useReference } from "@/lib/enrollment/reference-context";
import type {
  ApplicationFormData,
  ApplicationFiles,
  DocumentType,
} from "@/lib/enrollment/types";
import { IMAGE_TYPES, validateFile } from "@/lib/enrollment/validate-file";
import { compressImage } from "@/lib/enrollment/compress-image";
import { CameraCapture } from "@/components/enrollment/camera-capture";
import { Button } from "@/components/ui/button";

interface StepProps {
  files: ApplicationFiles;
  onChange: (patch: Partial<ApplicationFiles>) => void;
  data: ApplicationFormData;
  onDataChange: (patch: Partial<ApplicationFormData>) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  // which slot is being scanned: "photo", a document id, or null (closed)
  const [scanTarget, setScanTarget] = useState<string | null>(null);

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

  const emailError = getStep6Errors(files, data, documentTypes).email;
  return (
    <div className="space-y-6">
      <p className="text-white/70">
        Upload a clear scan or photo of each document. You will still need to
        bring the originals to the school for verification.
      </p>

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
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

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Profile Picture
        </h3>
        <div className="mt-4 flex items-center gap-4">
          <div className="size-24 overflow-hidden rounded-full border border-white/15 bg-white/10">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              className="text-sm text-white/70"
              accept={IMAGE_TYPES.join(",")}
              onChange={(e) => pick("photo", e.target.files?.[0], IMAGE_TYPES)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit text-primary"
              onClick={() => setScanTarget("photo")}
            >
              Take a photo
            </Button>
          </div>
        </div>
        {pickErrors.photo && (
          <p className="mt-2 text-sm text-red-400">{pickErrors.photo}</p>
        )}
      </div>

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Required Documents
        </h3>
        <div className="mt-4 space-y-4">
          {documentTypes.map((d) => (
            <div key={d.id}>
              <p className="text-sm font-medium text-white">{d.name}</p>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="file"
                  className="text-sm text-white/70"
                  accept={IMAGE_TYPES.join(",")}
                  onChange={(e) => pick(d.id, e.target.files?.[0], IMAGE_TYPES)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit text-primary"
                  onClick={() => setScanTarget(d.id)}
                >
                  Scan document
                </Button>
              </div>
              {files.documents[d.id] && (
                <p className="mt-1 text-xs text-white/50">
                  {files.documents[d.id]!.name}
                </p>
              )}
              {pickErrors[d.id] && (
                <p className="mt-1 text-sm text-red-400">{pickErrors[d.id]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <CameraCapture
        open={scanTarget !== null}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title={
          scanTarget === "photo" ? "Take profile picture" : "Scan document"
        }
        facing={scanTarget === "photo" ? "user" : "environment"}
        onCapture={(file) => {
          if (scanTarget) pick(scanTarget, file, IMAGE_TYPES);
        }}
        mode={scanTarget === "photo" ? "photo" : "document"}
      />
    </div>
  );
}
