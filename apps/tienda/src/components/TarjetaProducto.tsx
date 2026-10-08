"use client";

import Image from "next/image";
import Link from "next/link";
import { categoriaDe, type Producto } from "@/lib/mock";
import { formatearPrecio } from "@/lib/precio";
import { useCarrito } from "./carrito/CarritoProvider";

export function primeraVarianteDisponible(p: Producto) {
  return p.variantes?.find((v) => v.disponibilidad !== "agotado")?.nombre ?? null;
}

export function agotado(p: Producto) {
  return p.variantes?.length ? !primeraVarianteDisponible(p) : p.disponibilidad === "agotado";
}

export function Insignia({ p }: { p: Producto }) {
  if (agotado(p)) return <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-fondo">Agotado</span>;
  if (p.disponibilidad === "por-encargo") return <span className="rounded-full bg-acento-claro px-2.5 py-1 text-xs font-semibold text-fondo">Por encargo</span>;
  if (p.precioAnterior) return <span className="rounded-full bg-acento px-2.5 py-1 text-xs font-semibold">Oferta</span>;
  return null;
}

export function TarjetaProducto({ p }: { p: Producto }) {
  const { agregar } = useCarrito();
  const cat = categoriaDe(p.categoria);
  const sinStock = agotado(p);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[18px] border border-white/8 bg-tarjeta transition-[transform,border-color] duration-200 hover:-translate-y-[3px] hover:border-acento/60 sm:rounded-3xl">
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-superficie">
        <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/80">{cat?.nombre}</span>
        <span className="absolute top-3 right-3">
          <Insignia p={p} />
        </span>
        <div aria-hidden="true" className="absolute size-[60%] rounded-full bg-acento/25 blur-[40px]" />
        <Image src={p.imagen} alt={p.nombre} width={1000} height={1000} sizes="(max-width: 640px) 50vw, 300px" className="relative size-[86%] object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="flex grow flex-col gap-1.5 p-3 sm:px-5 sm:pt-[18px] sm:pb-5">
        <span className="text-xs tracking-wide text-acento-claro uppercase">{p.marca}</span>
        <h3 className="text-[15px] leading-snug font-semibold sm:text-[17px]">
          <Link href={`/p/${p.slug}`} className="after:absolute after:inset-0">
            {p.nombre}
          </Link>
        </h3>
        <p className="hidden grow text-[15px] leading-relaxed text-white/62 sm:block">{p.resumen}</p>
        {p.variantes?.length ? (
          <div className="flex gap-1.5" aria-label={`Colores: ${p.variantes.map((v) => v.nombre).join(", ")}`}>
            {p.variantes.map((v) => (
              <span
                key={v.nombre}
                title={v.nombre}
                className={`size-3.5 rounded-full border border-white/30 ${v.disponibilidad === "agotado" ? "opacity-30" : ""}`}
                style={{ background: v.color }}
              />
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 sm:mt-3">
          <div className="flex flex-col leading-tight">
            {p.precioAnterior && <s className="text-[13px] text-white/45">{formatearPrecio(p.precioAnterior)}</s>}
            <span className="text-base font-bold sm:text-[19px]">{formatearPrecio(p.precio)}</span>
          </div>
          <button
            type="button"
            disabled={sinStock}
            onClick={() => agregar(p.id, primeraVarianteDisponible(p))}
            aria-label={sinStock ? `${p.nombre} está agotado` : `Agregar ${p.nombre} al carrito`}
            className="presionable relative z-10 inline-flex size-11 items-center justify-center gap-1.5 rounded-full bg-acento text-[15px] font-semibold disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 sm:h-11 sm:w-auto sm:px-[18px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">{sinStock ? "Agotado" : "Agregar"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
