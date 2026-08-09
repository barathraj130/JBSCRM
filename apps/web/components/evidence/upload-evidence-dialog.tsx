"use client";

import * as React from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";

/**
 * Opened when the API rejects a status/completion claim with EVIDENCE_REQUIRED — no verified
 * in-app record exists (e.g. contact happened over a personal WhatsApp/SMS), so a screenshot is
 * required as self-reported proof before the claim is accepted.
 */
export function UploadEvidenceDialog({
  open,
  onOpenChange,
  title,
  description,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onUploaded: (imageUrl: string) => Promise<void> | void;
}) {
  const { token } = useAuth();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setError(null);
    }
  }, [open]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!token || !file) return;
    setSubmitting(true);
    setError(null);
    try {
      const { url } = await api.uploadFile(token, file);
      await onUploaded(url);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">{description}</p>

        {preview ? (
          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Evidence preview" className="max-h-64 w-full object-contain" />
          </div>
        ) : (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-accent">
            <Upload className="h-5 w-5" />
            Choose a screenshot
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        )}

        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Choose a different image
          </button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSubmit} disabled={!file || submitting} className="w-full">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Upload and continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
