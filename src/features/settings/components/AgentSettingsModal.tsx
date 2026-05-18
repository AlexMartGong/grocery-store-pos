import { useEffect, useState, type SyntheticEvent } from "react";
import { CheckCircle2, Copy, Loader2, Network, Printer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../../../shared/components/ui/Modal";
import {
  pingAgent,
  fetchStationsFromCloud,
  type StoreStationResponse,
} from "../../../shared/api/agentApi";
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
  const [stations, setStations] = useState<StoreStationResponse[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setUrl(stored);
      setTest({ kind: "idle" });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, stored]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchStationsFromCloud().then((data) => {
      if (cancelled) return;
      setStations(data);
      setSelectedStationId((prev) =>
        prev === "" && data.length > 0 ? data[0].id : prev,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSyncFromCloud = () => {
    const station = stations.find((s) => s.id === selectedStationId);
    if (station?.agentUrl) {
      setLocalAgentUrl(station.agentUrl);
      setUrl(station.agentUrl);
      setTest({ kind: "discovered" });
      toast.success("IP sincronizada con la caja");
    } else {
      setTest({ kind: "fail" });
      toast.error(
        "Esta caja aún no reporta su IP. Verifica que el Agente PC esté encendido.",
      );
    }
  };

  const handleTest = async () => {
    setTest({ kind: "testing" });
    const ok = await pingAgent(url.trim());
    setTest({ kind: ok ? "ok" : "fail" });
  };

  const handleCopyStationId = async () => {
    if (!selectedStationId) return;

    if (!navigator?.clipboard) {
      toast.error("Portapapeles no disponible. Requiere conexión segura (HTTPS o localhost).");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedStationId);
      toast.success("ID copiado al portapapeles");
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
      toast.error("No se pudo copiar el ID. Verifica los permisos del navegador.");
    }
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
            htmlFor="station-select"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Caja / Estación
          </label>
          <select
            id="station-select"
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {stations.length === 0 ? (
              <option value="" disabled>
                No hay cajas registradas
              </option>
            ) : (
              stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </div>

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
              disabled={test.kind === "testing" || !url.trim()}
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
              onClick={handleSyncFromCloud}
              disabled={test.kind === "testing" || !selectedStationId}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Network aria-hidden className="h-4 w-4" />
              Sincronizar IP con la Nube
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
              IP del agente sincronizada desde la nube.
            </span>
          )}
        </div>

        <hr className="my-6 border-slate-200" />

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Configuración del Agente Local (PC)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Copia este ID de Estación y pégalo como <code>station.id</code> en el
            archivo <code>config.properties</code> de la PC donde está conectada la
            impresora.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-800">
              {selectedStationId || "No disponible"}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyStationId()}
              disabled={!selectedStationId}
              aria-label="Copiar ID de estación"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy aria-hidden className="h-4 w-4" />
              Copiar
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
};
