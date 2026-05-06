import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModalAnimation } from "../../hooks/useModalAnimation";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, description, children }: ModalProps) => {
  const titleId = useId();
  const descId = useId();
  const { render, show } = useModalAnimation(isOpen, { onClose });

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md transform rounded-t-2xl bg-white p-4 shadow-xl transition-all duration-300 ease-out sm:rounded-2xl sm:p-6 ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
