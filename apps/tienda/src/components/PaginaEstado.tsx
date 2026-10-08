import { AJUSTES } from "@/lib/mock";
import { BocinaWire } from "./EstadoVacio";

type Accion = { texto: string; href?: string; onClick?: () => void; externa?: boolean; deshabilitada?: boolean };

// Página completa para errores y estados del sitio (404, 403, 429, 500, 503, sin conexión).
export function PaginaEstado({
  codigo,
  titulo,
  texto,
  acciones,
}: {
  codigo: string;
  titulo: string;
  texto: string;
  acciones: Accion[];
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[640px] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="relative grid place-items-center">
        <div className="absolute size-48 rounded-full bg-acento/35 blur-[60px]" aria-hidden="true" />
        <BocinaWire className="relative size-36" />
      </div>
      <span className="font-mono text-sm tracking-[0.2em] text-acento-claro">{codigo}</span>
      <h1 className="titulo-display text-[32px] sm:text-[44px]">{titulo}</h1>
      <p className="text-[17px] leading-relaxed text-white/70">{texto}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {acciones.map((a, i) => {
          const clase = `presionable inline-flex min-h-[50px] items-center rounded-full px-7 text-[17px] font-semibold disabled:opacity-40 ${
            i === 0 ? "bg-acento" : "border border-white/24"
          }`;
          return a.href ? (
            <a key={a.texto} href={a.href} className={clase} {...(a.externa ? { target: "_blank", rel: "noreferrer" } : {})}>
              {a.texto}
            </a>
          ) : (
            <button key={a.texto} type="button" onClick={a.onClick} disabled={a.deshabilitada} className={clase}>
              {a.texto}
            </button>
          );
        })}
      </div>
    </main>
  );
}

export const accionWhatsapp: Accion = { texto: "Escribinos por WhatsApp", href: `https://wa.me/${AJUSTES.whatsapp}`, externa: true };
