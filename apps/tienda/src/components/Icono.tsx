// Ícono de trazo a partir de los paths SVG (viewBox 64×64) de una categoría.
// Los trazos vienen de datos propios del mockup; con el admin, el SVG llega sanitizado desde Payload.
export function Icono({ trazos, className, strokeWidth = 3 }: { trazos: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: trazos }}
    />
  );
}
