"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, UploadCloud, X } from "lucide-react";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void> | void;
};

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelection = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleAnalyse = async () => {
    if (!selectedFile || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    try {
      await Promise.resolve(onUpload(selectedFile));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div
        className="relative z-10 mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/40 animate-in fade-in"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Nueva prenda
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">Analiza una pieza nueva</p>
            <p className="text-sm text-slate-500">
              Recibiremos la imagen y la prepararemos para que Gemini sugiera combinaciones perfectas.
            </p>
          </div>

          {!previewUrl && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-10 text-center text-slate-500 transition hover:border-slate-500 hover:text-slate-900"
            >
              <UploadCloud className="h-12 w-12" />
              <p className="text-base font-semibold">Arrastra tu prenda aquí</p>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">PNG / JPG / HEIC</p>
              <span className="text-[0.65rem] text-slate-400">También puedes hacer clic para buscar</span>
            </div>
          )}

          {previewUrl && (
            <div className="relative">
              <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={previewUrl}
                  alt={selectedFile?.name ?? "Prenda"}
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute right-3 top-3 rounded-full border border-white bg-white/70 p-1 text-slate-500 shadow-lg shadow-slate-900/20 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Eliminar vista previa"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {selectedFile?.name}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleAnalyse}
              disabled={!selectedFile || isAnalyzing}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analizando con Gemini..." : "Analizar Prenda"}
            </button>
            <p className="text-[0.7rem] uppercase tracking-[0.4em] text-slate-400">
              Una vez listo, cerramos el modal desde la configuración.
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
