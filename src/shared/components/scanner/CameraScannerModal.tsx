import { useEffect, useId, useRef, useState } from "react";
import { Camera, CameraOff, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useModalAnimation } from "../../hooks/useModalAnimation";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

const SCAN_REGION_ID = "barcode-scanner-region";

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const errorMessageFor = (err: unknown): string => {
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err);
  if (name === "NotAllowedError" || /permission/i.test(message)) {
    return "Permiso de cámara denegado. Habilítalo en los ajustes del navegador.";
  }
  if (name === "NotFoundError" || /not.*found/i.test(message)) {
    return "No se detectó ninguna cámara disponible.";
  }
  if (name === "NotReadableError") {
    return "La cámara está en uso por otra aplicación.";
  }
  return "No se pudo iniciar la cámara. Intenta de nuevo.";
};

export const CameraScannerModal = ({
  open,
  onClose,
  onScan,
  title = "Escanear código",
}: CameraScannerModalProps) => {
  const titleId = useId();
  const { render, show } = useModalAnimation(open, { onClose });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!render) return;
    handledRef.current = false;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const stop = async () => {
      const s = scanner;
      if (!s) return;
      try {
        if (s.isScanning) await s.stop();
        s.clear();
      } catch {
        /* ignore — already stopped or never started */
      }
    };

    const config = { fps: 10, qrbox: { width: 280, height: 180 }, aspectRatio: 1.333 };

    const onDecoded = (decoded: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      void stop().then(() => {
        onScanRef.current(decoded);
        onCloseRef.current();
      });
    };

    const startWithFallback = async (s: Html5Qrcode) => {
      try {
        await s.start({ facingMode: { ideal: "environment" } }, config, onDecoded, () => {});
        return;
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name !== "NotFoundError" && !/not.*found/i.test(String(err))) throw err;
      }
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        throw Object.assign(new Error("No cameras"), { name: "NotFoundError" });
      }
      await s.start(cameras[0].id, config, onDecoded, () => {});
    };

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const node = document.getElementById(SCAN_REGION_ID);
      if (!node) {
        requestAnimationFrame(() => {
          setError("No se pudo iniciar la cámara. Intenta de nuevo.");
          setStarting(false);
        });
        return;
      }

      requestAnimationFrame(() => {
        setError(null);
        setStarting(true);
      });

      scanner = new Html5Qrcode(SCAN_REGION_ID, { formatsToSupport: FORMATS, verbose: false });
      scannerRef.current = scanner;

      startWithFallback(scanner)
        .then(() => {
          if (cancelled) {
            void stop();
            return;
          }
          requestAnimationFrame(() => setStarting(false));
        })
        .catch((err) => {
          if (cancelled) return;
          const msg = errorMessageFor(err);
          requestAnimationFrame(() => {
            setError(msg);
            setStarting(false);
          });
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void stop();
      scannerRef.current = null;
    };
  }, [render, retryNonce]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md transform rounded-t-2xl bg-white p-4 shadow-xl transition-all duration-300 ease-out sm:rounded-2xl sm:p-6 ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Camera aria-hidden className="h-5 w-5 text-slate-700" />
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar escáner"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-[4/3]">
            <div
              id={SCAN_REGION_ID}
              className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            />
            {starting && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-200">
                Iniciando cámara...
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-100">
                <CameraOff aria-hidden className="h-8 w-8 text-rose-300" />
                <p className="text-sm">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStarting(true);
                    setRetryNonce((n) => n + 1);
                  }}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
          <p className="text-center text-sm text-slate-500">
            Apunta la cámara al código de barras o QR.
          </p>
        </div>
      </div>
    </div>
  );
};
