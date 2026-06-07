"use client";

import { useEffect, useRef, useState } from "react";
import { isImageFileExtensionAllowed, isImageMimeAllowed } from "@/lib/admin-store";

interface ImageUploadModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void;
  initialImage?: string;
}

export default function ImageUploadModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  initialImage = "",
}: ImageUploadModalProps) {
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    // Initialize preview with initial image when modal opens
    if (isOpen) {
      setPreview(initialImage);
      setError("");
      setFileName("");
    }
  }, [isOpen, initialImage]);

  function readAsDataUrl(file: File, callback: (value: string) => void) {
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const mime = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!isImageMimeAllowed(mime)) {
      setError(`MIME type ${mime} tidak diizinkan. Gunakan JPG, PNG, atau WebP.`);
      return;
    }

    if (!isImageFileExtensionAllowed(ext)) {
      setError(`Ekstensi .${ext} tidak diizinkan. Gunakan .jpg, .png, atau .webp`);
      return;
    }

    setError("");
    setFileName(file.name);
    readAsDataUrl(file, (value) => setPreview(value));
  }

  function handleConfirm() {
    if (!preview) {
      setError("Pilih gambar terlebih dahulu");
      return;
    }
    onConfirm(preview);
    handleClose();
  }

  function handleClose() {
    setPreview(initialImage);
    setError("");
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        <div className="mt-4 space-y-4">
          {/* File Input */}
          <div>
            <label className="block">
              <span className="inline-block rounded-lg bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 cursor-pointer hover:bg-cyan-100 transition">
                Pilih Gambar (JPG, PNG, WebP)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="mt-4 overflow-hidden rounded-xl border border-cyan-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview gambar"
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          {/* File Name Indicator */}
          {fileName && (
            <p className="text-xs text-slate-500">
              File: {fileName}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 font-medium text-white hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Gambar
          </button>
        </div>
      </div>
    </div>
  );
}
