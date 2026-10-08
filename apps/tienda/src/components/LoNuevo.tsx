"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ARTES } from "@/lib/mock";

const flecha = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

// Carrusel con snap nativo (scroll-snap): el navegador da el momentum y el rubber-band en touch.
export function LoNuevo() {
  const riel = useRef<HTMLUListElement>(null);
  if (!ARTES.length) return null; // sin artes activas, el bloque no se muestra

  const mover = (dir: number) => {
    const r = riel.current;
    const tarjeta = r?.querySelector("li");
    if (r && tarjeta) r.scrollBy({ left: dir * (tarjeta.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="lo-nuevo" className="py-20">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-4 px-4 pb-5 sm:px-6">
        <h2 id="lo-nuevo" className="text-[28px] font-bold tracking-tight sm:text-[40px]">
          Lo nuevo. <span className="text-white/55">Mira lo que llegó a Infinitech.</span>
        </h2>
        <div className="hidden gap-2.5 sm:flex">
          <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className="presionable grid size-11 place-items-center rounded-full bg-white/10">
            {flecha("M15 6l-6 6 6 6")}
          </button>
          <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className="presionable grid size-11 place-items-center rounded-full bg-white/10">
            {flecha("M9 6l6 6-6 6")}
          </button>
        </div>
      </div>
      <ul
        ref={riel}
        className="sin-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[max(16px,calc(50%-576px))] pb-6 [scroll-padding-inline:max(16px,calc(50%-576px))]"
      >
        {ARTES.map((a) => (
          <li key={a.id} className="w-[min(372px,82%)] shrink-0 snap-start">
            <Link
              href={a.producto ? `/p/${a.producto}` : "/#productos"}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] border border-white/8 bg-superficie"
            >
              <Image src={a.imagen} alt={a.titulo} fill sizes="(max-width: 640px) 82vw, 372px" className="object-cover transition-transform duration-300 group-hover:scale-[1.015]" />
              {/* Las artes que ya traen su texto no llevan título encima */}
              {a.conTexto ? (
                <h3 className="sr-only">{a.titulo}</h3>
              ) : (
                <div className="absolute inset-x-0 top-0 flex flex-col gap-1 bg-gradient-to-b from-black/60 to-transparent p-6 pb-16">
                  <span className="text-[13px] font-semibold tracking-wide text-acento-claro uppercase">{a.etiqueta}</span>
                  <h3 className="text-[26px] leading-tight font-bold">{a.titulo}</h3>
                </div>
              )}
              <span className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full bg-texto text-fondo" aria-hidden="true">
                {flecha("M5 12h14M13 6l6 6-6 6")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
