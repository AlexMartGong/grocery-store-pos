import axios from "axios";
import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Package,
  Save,
  Trash2,
} from "lucide-react";
import {
  createProduct,
  deleteProductImage,
  getProductById,
  searchByBarcode,
  updateProduct,
  uploadProductImage,
} from "../api/productsApi";
import { mapProductsError, PRODUCTS_ERROR_MESSAGES } from "../utils/errorMessages";
import { CameraScannerModal } from "../../../shared/components/scanner/CameraScannerModal";
import { ProductImage } from "../../../shared/components/ui/ProductImage";
import { playBeep, vibrate } from "../../../shared/utils/feedback";
import type { ApiErrorResponse } from "../../auth/types";
import type { UnitOfMeasure } from "../types";

interface FormState {
  barcode: string;
  name: string;
  purchase_cost: string;
  sale_price: string;
  current_stock: string;
  minimum_stock: string;
  unit_of_measure: UnitOfMeasure;
}

const INITIAL: FormState = {
  barcode: "",
  name: "",
  purchase_cost: "",
  sale_price: "",
  current_stock: "0",
  minimum_stock: "0",
  unit_of_measure: "PIECE",
};

const BARCODE_PATTERN = "[-A-Za-z0-9._]*";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit || loading) return;
    barcodeRef.current?.focus();
  }, [isEdit, loading]);

  const checkBarcodeOwnership = async (code: string) => {
    if (!code.trim()) {
      setDuplicateMessage(null);
      return;
    }
    try {
      const existing = await searchByBarcode(code.trim());
      if (existing && existing.id !== id) {
        setDuplicateMessage(`Este código ya pertenece al producto: ${existing.name}`);
      } else {
        setDuplicateMessage(null);
      }
    } catch {
      setDuplicateMessage(null);
    }
  };

  const handleScan = (code: string) => {
    const trimmed = code.trim();
    setForm((prev) => ({ ...prev, barcode: trimmed }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.barcode;
      return next;
    });
    vibrate(50);
    playBeep();
    void checkBarcodeOwnership(trimmed);
  };

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const product = await getProductById(id);
        if (cancelled) return;
        setForm({
          barcode: product.barcode ?? "",
          name: product.name,
          purchase_cost: product.purchase_cost,
          sale_price: product.sale_price,
          current_stock: product.current_stock,
          minimum_stock: product.minimum_stock,
          unit_of_measure: product.unit_of_measure,
        });
        setImageUrl(product.image_url ?? null);
      } catch (err) {
        if (!cancelled) setError(mapProductsError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(PRODUCTS_ERROR_MESSAGES.image_type_not_allowed);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(PRODUCTS_ERROR_MESSAGES.image_too_large);
      return;
    }
    setImageBusy(true);
    try {
      const updated = await uploadProductImage(id, file);
      setImageUrl(updated.image_url ?? null);
      toast.success("Imagen actualizada");
    } catch (err) {
      toast.error(mapProductsError(err));
    } finally {
      setImageBusy(false);
    }
  };

  const handleImageDelete = async () => {
    if (!id) return;
    setImageBusy(true);
    try {
      await deleteProductImage(id);
      setImageUrl(null);
      toast.success("Imagen eliminada");
    } catch (err) {
      toast.error(mapProductsError(err));
    } finally {
      setImageBusy(false);
      setConfirmDeleteImage(false);
    }
  };

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    const payload = {
      ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
      name: form.name,
      ...(form.purchase_cost !== "" ? { purchase_cost: form.purchase_cost } : {}),
      sale_price: form.sale_price,
      current_stock: form.current_stock,
      minimum_stock: form.minimum_stock,
      unit_of_measure: form.unit_of_measure,
    };
    try {
      if (isEdit && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate("/pos/products");
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapProductsError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/pos/products")}
          className="inline-flex items-center gap-1.5 rounded text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </button>

        <div className="space-y-6 rounded-2xl bg-white p-4 shadow-xl md:p-8">
          <header className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              {isEdit ? <Save className="h-6 w-6" /> : <Package className="h-6 w-6" />}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Actualiza la información del producto. Para mover stock usa 'Ajustar stock' en la lista."
                : "Registra un nuevo artículo en el catálogo de tu tienda."}
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="py-12 text-center text-slate-400">Cargando...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="barcode" className="block text-sm font-medium text-slate-700">
                  Código de barras <span className="text-xs font-normal text-slate-400">(opcional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="barcode"
                    name="barcode"
                    ref={barcodeRef}
                    type="text"
                    value={form.barcode}
                    onChange={(e) => {
                      set("barcode", e.target.value);
                      if (duplicateMessage) setDuplicateMessage(null);
                    }}
                    onBlur={(e) => void checkBarcodeOwnership(e.target.value)}
                    maxLength={50}
                    pattern={BARCODE_PATTERN}
                    autoComplete="off"
                    title="Letras, dígitos, punto, guion bajo, guion."
                    className={`${inputClass(Boolean(fieldErrors.barcode) || Boolean(duplicateMessage))} font-mono text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    aria-label="Escanear código de barras con la cámara"
                    title="Escanear con cámara"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                {fieldErrors.barcode && (
                  <p className="mt-1 text-sm text-rose-500">{fieldErrors.barcode}</p>
                )}
                {!fieldErrors.barcode && duplicateMessage && (
                  <p className="mt-1 text-sm text-rose-500">{duplicateMessage}</p>
                )}
                {!fieldErrors.barcode && !duplicateMessage && (
                  <p className="text-xs text-slate-500">
                    Usa el botón de cámara o un lector físico para capturarlo.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  maxLength={150}
                  className={inputClass(Boolean(fieldErrors.name))}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-rose-500">{fieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="sale_price" className="block text-sm font-medium text-slate-700">
                    Precio de venta
                  </label>
                  <input
                    id="sale_price"
                    name="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sale_price}
                    onChange={(e) => set("sale_price", e.target.value)}
                    required
                    inputMode="decimal"
                    className={inputClass(Boolean(fieldErrors.sale_price))}
                  />
                  {fieldErrors.sale_price && (
                    <p className="mt-1 text-sm text-rose-500">{fieldErrors.sale_price}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="purchase_cost" className="block text-sm font-medium text-slate-700">
                    Costo de compra <span className="text-xs font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    id="purchase_cost"
                    name="purchase_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchase_cost}
                    onChange={(e) => set("purchase_cost", e.target.value)}
                    inputMode="decimal"
                    className={inputClass(Boolean(fieldErrors.purchase_cost))}
                  />
                  {fieldErrors.purchase_cost && (
                    <p className="mt-1 text-sm text-rose-500">{fieldErrors.purchase_cost}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="current_stock" className="block text-sm font-medium text-slate-700">
                    Stock actual
                  </label>
                  <input
                    id="current_stock"
                    name="current_stock"
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.current_stock}
                    onChange={(e) => set("current_stock", e.target.value)}
                    required
                    disabled={isEdit}
                    inputMode="decimal"
                    className={`${inputClass(Boolean(fieldErrors.current_stock))} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
                  />
                  {fieldErrors.current_stock ? (
                    <p className="mt-1 text-sm text-rose-500">{fieldErrors.current_stock}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {isEdit
                        ? "Usa 'Ajustar stock' en la lista para modificar inventario."
                        : "Stock inicial al registrar el producto."}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="minimum_stock" className="block text-sm font-medium text-slate-700">
                    Stock mínimo
                  </label>
                  <input
                    id="minimum_stock"
                    name="minimum_stock"
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.minimum_stock}
                    onChange={(e) => set("minimum_stock", e.target.value)}
                    required
                    inputMode="decimal"
                    className={inputClass(Boolean(fieldErrors.minimum_stock))}
                  />
                  {fieldErrors.minimum_stock && (
                    <p className="mt-1 text-sm text-rose-500">{fieldErrors.minimum_stock}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="unit_of_measure" className="block text-sm font-medium text-slate-700">
                  Unidad de medida
                </label>
                <select
                  id="unit_of_measure"
                  name="unit_of_measure"
                  value={form.unit_of_measure}
                  onChange={(e) => set("unit_of_measure", e.target.value as UnitOfMeasure)}
                  required
                  className={inputClass(Boolean(fieldErrors.unit_of_measure))}
                >
                  <option value="PIECE">Pieza (PIECE)</option>
                  <option value="KILO">Kilo (KILO)</option>
                </select>
                {fieldErrors.unit_of_measure && (
                  <p className="mt-1 text-sm text-rose-500">{fieldErrors.unit_of_measure}</p>
                )}
              </div>

              {isEdit && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-700">Imagen del producto</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <ProductImage
                      src={imageUrl}
                      alt={form.name ? `Imagen de ${form.name}` : "Imagen del producto"}
                      className="h-24 w-24 rounded-xl border border-slate-200 bg-slate-100 object-cover"
                      fallback={
                        <div
                          aria-hidden="true"
                          className="flex h-24 w-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400"
                        >
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      }
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                        onChange={(e) => void handleImageSelect(e)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageBusy}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {imageBusy ? (
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          ) : (
                            <ImagePlus aria-hidden className="h-4 w-4" />
                          )}
                          {imageBusy
                            ? "Procesando..."
                            : imageUrl
                              ? "Cambiar imagen"
                              : "Subir imagen"}
                        </button>
                        {imageUrl && !confirmDeleteImage && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteImage(true)}
                            disabled={imageBusy}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 aria-hidden className="h-4 w-4" /> Eliminar imagen
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">JPG, PNG o WEBP. Máximo 2 MB.</p>
                    </div>
                  </div>
                  {confirmDeleteImage && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                      <p className="flex-1 text-sm text-rose-700">
                        ¿Eliminar la imagen del producto?
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleImageDelete()}
                        disabled={imageBusy}
                        className="rounded-md bg-rose-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageBusy ? "Eliminando..." : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteImage(false)}
                        disabled={imageBusy}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/pos/products")}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEdit ? <Save className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <CameraScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        title="Escanear código de barras"
      />
    </div>
  );
};
