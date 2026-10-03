// src/app/admin/(portal)/applications/_components/documents-tab.tsx
"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ExternalLink, FileText, FileX, Loader2, User } from "lucide-react";
import { useReference } from "@/lib/enrollment/reference-context";
import { pdfPreviewDataUrl } from "@/lib/scan/pdf-preview";
import type {
  ApplicationStoredFiles,
  StoredFile,
} from "@/lib/enrollment/application-files";

type Props = { files: ApplicationStoredFiles };

const openLinkClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10";

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
}: {
  file: StoredFile | null;
  alt: string;
  boxClass: string;
  fit: "cover" | "contain";
  EmptyIcon: ComponentType<{ className?: string }>;
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
    </div>
  );
}

export function DocumentsTab({ files }: Props) {
  const { documentTypes } = useReference();

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">
        Files open through temporary secure links. If a link stops working,
        reload the page.
      </p>
      {files.error && <p className="text-sm text-red-400">{files.error}</p>}

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Profile Picture
        </h3>
        <div className="mt-4 flex items-center gap-4">
          <PreviewBox
            file={files.photo}
            alt="Profile picture"
            boxClass="h-44 w-36 shrink-0"
            fit="cover"
            EmptyIcon={User}
          />
          <div className="min-w-0 max-w-xs flex-1">
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
          </div>
        </div>
      </div>

      <div className="rounded-md border border-white/15 bg-secondary/70 p-5">
        <h3 className="border-b border-white/15 pb-2 font-serif text-sm font-semibold text-white">
          Required Documents
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {documentTypes.map((d) => {
            const file = files.documents[d.id] ?? null;
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
                  fit="contain"
                  EmptyIcon={FileX}
                />
                <div className="mt-3">
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
