import { useEffect, useState, type SyntheticEvent } from "react";
import { CheckCircle2, Loader2, Network, Printer, XCircle } from "lucide-react";
import { Modal } from "../../../shared/components/ui/Modal";
import { pingAgent } from "../../../shared/api/agentApi";
import { useSettingsStore } from "../store/settingsStore";

interface AgentSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TestState =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok" }
  | { kind: "fail" }
  | { kind: "discovered" };

export const AgentSettingsModal = ({ open, onClose }: AgentSettingsModalProps) => {
  const stored = useSettingsStore((s) => s.localAgentUrl);
  const setLocalAgentUrl = useSettingsStore((s) => s.setLocalAgentUrl);

  const [url, setUrl] = useState(stored);
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setUrl(stored);
      setTest({ kind: "idle" });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, stored]);

  const handleAutoDiscover = async () => {
    setIsScanning(true);
    try {
      const ok = await useSettingsStore.getState().autoDiscoverAgent();
      if (ok) {
        setUrl(useSettingsStore.getState().localAgentUrl);
        setTest({ kind: "discovered" });
      } else {
        setTest({ kind: "fail" });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleTest = async () => {
    setTest({ kind: "testing" });
    const ok = await pingAgent(url.trim());
    setTest({ kind: ok ? "ok" : "fail" });
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalAgentUrl(url);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Agente de impresión"
      description="Configura la URL del agente local que envía los tickets a la impresora ESC/POS."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agent-url"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            URL del agente
          </label>
          <input
            id="agent-url"
            type="url"
            required
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTest({ kind: "idle" });
            }}
            disabled={isScanning}
            placeholder="http://192.168.1.10:8081"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-slate-500">
            En móviles, usa la IP de la PC con el agente (ej. <code>http://192.168.1.10:8081</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={test.kind === "testing" || isScanning || !url.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {test.kind === "testing" ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Printer aria-hidden className="h-4 w-4" />
              )}
              Probar conexión
            </button>
            <button
              type="button"
              onClick={() => void handleAutoDiscover()}
              disabled={isScanning || test.kind === "testing"}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isScanning ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Network aria-hidden className="h-4 w-4" />
              )}
              {isScanning ? "Buscando..." : "Auto-detectar red"}
            </button>
          </div>
          {test.kind === "ok" && (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"
            >
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              Agente respondió
            </span>
          )}
          {test.kind === "fail" && (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-sm font-medium text-rose-700"
            >
              <XCircle aria-hidden className="h-4 w-4" />
              Sin respuesta
            </span>
          )}
          {test.kind === "discovered" && (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"
            >
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              Caja encontrada y actualizada
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isScanning}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};
