"use client";

import { useRef } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const MAX = 4;

export interface ImageUploaderProps {
  existingUrls: string[];          // already-saved URLs
  newFiles: { file: File; preview: string }[];
  onAddFiles: (files: { file: File; preview: string }[]) => void;
  onRemoveExisting: (idx: number) => void;
  onRemoveNew: (idx: number) => void;
}

export function ImageUploader({
  existingUrls,
  newFiles,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { error: showError } = useToast();
  const total = existingUrls.length + newFiles.length;
  const canAdd = total < MAX;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const slots = MAX - total;
    const valid = files
      .filter((f) => {
        if (!f.type.startsWith("image/")) { showError(`${f.name} is not an image`); return false; }
        if (f.size > 4 * 1024 * 1024) { showError(`${f.name} is too large (max 4MB)`); return false; }
        return true;
      })
      .slice(0, slots);
    if (valid.length > 0) {
      onAddFiles(valid.map((file) => ({ file, preview: URL.createObjectURL(file) })));
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {/* Existing images */}
        {existingUrls.map((url, i) => (
          <div key={`ex-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-[var(--border)] bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">MAIN</span>
            )}
            {/* DELETE BUTTON */}
            <button
              type="button"
              onClick={() => onRemoveExisting(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
        ))}

        {/* New (pending upload) images */}
        {newFiles.map((img, i) => (
          <div key={`new-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-success bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.preview} alt="New photo" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 text-[9px] bg-success text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
            {/* DELETE BUTTON */}
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-10"
              aria-label="Remove new photo"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-primary/60 flex flex-col items-center justify-center gap-1 bg-cream/40 hover:bg-cream transition text-[var(--color-sage)] hover:text-primary"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-[10px] font-semibold">Add</span>
          </button>
        )}

        {/* Empty drop zone when no images */}
        {total === 0 && (
          <div className="col-span-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[var(--border)] hover:border-primary/60 rounded-xl py-10 flex flex-col items-center gap-3 bg-cream/30 hover:bg-cream/60 transition text-[var(--color-sage)] hover:text-primary"
            >
              <Upload className="h-8 w-8" />
              <div className="text-center">
                <p className="font-semibold text-sm">Click to upload photos</p>
                <p className="text-xs mt-0.5">JPG, PNG, WebP · max 4MB each · up to {MAX} photos</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--color-sage)]">
        {total}/{MAX} photos · First photo is main image · Click the <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold">✕</span> to delete
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
