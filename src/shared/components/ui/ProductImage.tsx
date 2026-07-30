import { useEffect, useState, type ReactNode } from "react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
}

/**
 * Product thumbnail with graceful fallback: renders `fallback` when there is
 * no `src` or the image fails to load. The error flag resets whenever `src`
 * changes (upload URLs are cache-busted per re-upload).
 */
export const ProductImage = ({ src, alt, className, fallback }: ProductImageProps) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setErrored(false));
    return () => cancelAnimationFrame(raf);
  }, [src]);

  if (!src || errored) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};
