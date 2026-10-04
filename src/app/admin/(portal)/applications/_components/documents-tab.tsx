// src/app/admin/(portal)/applications/_components/documents-tab.tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ExternalLink,
  FileText,
  FileX,
  Loader2,
  ScanLine,
  Upload,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReference } from "@/lib/enrollment/reference-context";
import { pdfPreviewDataUrl } from "@/lib/scan/pdf-preview";
import { compressImage } from "@/lib/enrollment/compress-image";
import { IMAGE_TYPES } from "@/lib/enrollment/validate-file";
import type {
  ApplicationStoredFiles,
  StoredFile,
} from "@/lib/enrollment/application-files";
import {
  createAdminUploadTarget,
  finishAdminUpload,
  type SlotRef,
} from "@/app/admin/(portal)/applications/[id]/file-actions";
import { CameraCapture } from "@/components/enrollment/camera-capture";
import DocumentScanner from "@/components/document-scanner/document-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import type { ApplicationFormData } from "@/lib/enrollment/types";

type Props = {
  applicationId: string;
  files: ApplicationStoredFiles;
  data: ApplicationFormData;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  readOnly?: boolean; // true = view only (approved application or teacher)
};

const openLinkClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10";

const PHOTO_ACCEPT = IMAGE_TYPES.join(",");
const DOC_ACCEPT = [...IMAGE_TYPES, "application/pdf"].join(",");

function PreviewImage({
  src,
  alt,
  fit,
}: {
  src: string;
  alt: string;
  fit: "cover" | "contain";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
}

function PreviewBox({
  file,
  alt,
  boxClass,
  fit,
  EmptyIcon,
  busy,
}: {
  file: StoredFile | null;
  alt: string;
  boxClass: string;
  fit: "cover" | "contain";
  EmptyIcon: ComponentType<{ className?: string }>;
  busy?: boolean;
}) {
  // For scanned PDFs: the page image pulled out of the PDF (src null = none found)
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    src: string | null;
  } | null>(null);

  useEffect(() => {
    if (!file?.isPdf) return;
    const url = file.url;
    let cancelled = false;

    (async () => {
      let src: string | null = null;
      try {
        const res = await fetch(url);
        if (res.ok) src = await pdfPreviewDataUrl(await res.blob());
      } catch {
        // fall back to the PDF label below
      }
      if (!cancelled) setPdfPreview({ url, src });
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  let content: React.ReactNode;
  if (!file) {
    content = (
      <div className="flex flex-col items-center gap-2 text-white/30">
        <EmptyIcon className="size-10" />
        <span className="text-xs">Not uploaded</span>
      </div>
    );
  } else if (!file.isPdf) {
    content = <PreviewImage src={file.url} alt={alt} fit={fit} />;
  } else if (!pdfPreview || pdfPreview.url !== file.url) {
    content = <Loader2 className="size-6 animate-spin text-white/50" />;
  } else if (pdfPreview.src) {
    content = (
      <>
        <PreviewImage src={pdfPreview.src} alt={alt} fit={fit} />
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          PDF
        </span>
      </>
    );
  } else {
    content = (
      <div className="flex flex-col items-center gap-2 text-white/70">
        <FileText className="size-10" />
        <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-medium">
          PDF
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/10 ${boxClass}`}
    >
      {content}
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="size-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

export function DocumentsTab({
  applicationId,
  files,
  data,
  onChange,
  readOnly = false,
}: Props) {
  const { documentTypes } = useReference();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const canEdit = !readOnly;
  const [busyKey, setBusyKey] = useState<string | null>(null); // "photo" or a document type id
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scanTarget, setScanTarget] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const docInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const disabled = busyKey !== null || refreshing;

  function setError(key: string, message: string) {
    setErrors((e) => ({ ...e, [key]: message }));
  }

  // 1) ask the server for an upload link, 2) send the file to storage,
  // 3) let the server record it, then reload the page data
  async function uploadFile(slot: SlotRef, key: string, picked: File) {
    setError(key, "");
    setBusyKey(key);
    try {
      let file = picked;
      if ((IMAGE_TYPES as readonly string[]).includes(picked.type)) {
        file = await compressImage(picked);
      }

      const target = await createAdminUploadTarget(applicationId, slot, {
        type: file.type,
        size: file.size,
      });
      if (!target.ok) {
        setError(key, target.error);
        return;
      }

      const { bucket, path, token, ext } = target.target;
      const { error } = await createClient()
        .storage.from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (error) {
        console.error("[documents-tab] upload failed", key, error);
        setError(key, "The upload failed. Please try again.");
        return;
      }

      const done = await finishAdminUpload(applicationId, slot, ext);
      if (!done.ok) {
        setError(key, done.error);
        return;
      }

      startRefresh(() => router.refresh());
    } catch (err) {
      console.error("[documents-tab] unexpected", err);
      setError(key, "Could not process that file. Try another one.");
    } finally {
      setBusyKey(null);
    }
  }

  function handlePick(
    e: ChangeEvent<HTMLInputElement>,
    slot: SlotRef,
    key: string,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadFile(slot, key, file);
  }

  const scanningDoc =
    scanTarget && scanTarget !== "photo"
      ? documentTypes.find((d) => d.id === scanTarget)
      : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">
        Files open through temporary secure links. If a link stops working,
        reload the page.
        {canEdit &&
          " You can replace a file until the application is approved."}
      </p>
      {files.error && <p className="text-sm text-red-400">{files.error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-full rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
          <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
            Email (optional)
          </h3>
          <Input
            id="email"
            type="email"
            className="mt-4 w-full"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div className="h-full rounded-md border border-white/15 bg-secondary/70 p-5 backdrop-blur-sm">
          <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
            Profile Picture
          </h3>

          <div className="mt-4 flex items-center gap-4">
            <PreviewBox
              file={files.photo}
              alt="Profile picture"
              boxClass="h-44 w-44 shrink-0"
              fit="cover"
              EmptyIcon={User}
              busy={busyKey === "photo"}
            />
            <div className="flex min-w-0 max-w-xs flex-1 flex-col gap-2">
              {files.photo ? (
                <a
                  href={files.photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={openLinkClass}
                >
                  <ExternalLink className="size-4" />
                  Open photo
                </a>
              ) : (
                <p className="text-sm text-white/50">
                  No profile picture uploaded.
                </p>
              )}

              {canEdit && (
                <>
                  <input
                    ref={photoInput}
                    type="file"
                    className="hidden"
                    accept={PHOTO_ACCEPT}
                    onChange={(e) => handlePick(e, { kind: "photo" }, "photo")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-primary"
                    disabled={disabled}
                    onClick={() => photoInput.current?.click()}
                  >
                    <Upload className="size-4" />
                    {files.photo ? "Replace file" : "Upload file"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-primary"
                    disabled={disabled}
                    onClick={() => setScanTarget("photo")}
                  >
                    <Camera className="size-4" />
                    Take a photo
                  </Button>
                </>
              )}
            </div>
          </div>
          {errors.photo && (
            <p className="mt-2 text-sm text-red-400">{errors.photo}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Required Documents
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {documentTypes.map((d) => {
            const file = files.documents[d.id] ?? null;
            const slot: SlotRef = { kind: "document", documentTypeId: d.id };
            return (
              <div
                key={d.id}
                className="flex flex-col rounded-md border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-medium text-white">{d.name}</p>
                <PreviewBox
                  file={file}
                  alt={`${d.name} preview`}
                  boxClass="mt-3 h-56 w-full"
                  fit="cover"
                  EmptyIcon={FileX}
                  busy={busyKey === d.id}
                />
                <div className="mt-3 flex flex-col gap-2">
                  {file ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={openLinkClass}
                    >
                      <ExternalLink className="size-4" />
                      {file.isPdf ? "Open PDF" : "Open file"}
                    </a>
                  ) : (
                    <p className="text-center text-xs text-white/50">
                      Nothing to open
                    </p>
                  )}

                  {canEdit && (
                    <>
                      <input
                        ref={(el) => {
                          docInputs.current[d.id] = el;
                        }}
                        type="file"
                        className="hidden"
                        accept={DOC_ACCEPT}
                        onChange={(e) => handlePick(e, slot, d.id)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-primary"
                        disabled={disabled}
                        onClick={() => docInputs.current[d.id]?.click()}
                      >
                        <Upload className="size-4" />
                        {file ? "Replace file" : "Upload file"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-primary"
                        disabled={disabled}
                        onClick={() => setScanTarget(d.id)}
                      >
                        <ScanLine className="size-4" />
                        Scan document
                      </Button>
                    </>
                  )}
                </div>
                {errors[d.id] && (
                  <p className="mt-2 text-sm text-red-400">{errors[d.id]}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <>
          {/* Profile photo: camera capture */}
          <CameraCapture
            open={scanTarget === "photo"}
            onOpenChange={(open) => {
              if (!open) setScanTarget(null);
            }}
            title="Take profile picture"
            facing="user"
            onCapture={(file) => uploadFile({ kind: "photo" }, "photo", file)}
            mode="photo"
          />

          {/* Documents: live scanner, saved as PDF */}
          {scanningDoc && (
            <DocumentScanner
              label={scanningDoc.name}
              fileName={`${scanningDoc.name}.pdf`}
              onCapture={(file) => {
                setScanTarget(null);
                uploadFile(
                  { kind: "document", documentTypeId: scanningDoc.id },
                  scanningDoc.id,
                  file,
                );
              }}
              onClose={() => setScanTarget(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
