"use client";

import { useState } from "react";
import { useCarrito } from "@/components/carrito/CarritoProvider";
import { agotado, primeraVarianteDisponible } from "@/components/TarjetaProducto";
import { AJUSTES, type Producto } from "@/lib/mock";

export function Comprar({ p }: { p: Producto }) {
  const { agregar } = useCarrito();
  const [variante, setVariante] = useState(primeraVarianteDisponible(p));
  const sinStock = agotado(p);

  return (
    <div className="flex flex-col gap-5">
      {p.variantes?.length ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[15px] text-white/80">
            Color: <span className="font-semibold text-white">{variante ?? "elegí uno"}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {p.variantes.map((v) => {
              const off = v.disponibilidad === "agotado";
              return (
                <button
                  key={v.nombre}
                  type="button"
                  disabled={off}
                  aria-pressed={variante === v.nombre}
                  aria-label={off ? `${v.nombre}, agotado` : v.nombre}
                  onClick={() => setVariante(v.nombre)}
                  className={`presionable relative grid size-11 place-items-center rounded-full border-2 ${
                    variante === v.nombre ? "border-acento-claro" : "border-white/20"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className="size-7 rounded-full border border-white/25" style={{ background: v.color }} />
                  {off && <span className="absolute h-0.5 w-9 rotate-45 bg-white/80" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {sinStock ? (
        <a
          href={`https://wa.me/${AJUSTES.whatsapp}?text=${encodeURIComponent(`Hola, avísenme cuando llegue: ${p.nombre}`)}`}
          target="_blank"
          rel="noreferrer"
          className="presionable flex min-h-13 items-center justify-center rounded-full border border-white/24 text-[17px] font-semibold"
        >
          Avisame cuando llegue
        </a>
      ) : (
        <button type="button" onClick={() => agregar(p.id, variante)} className="presionable min-h-13 rounded-full bg-acento text-[17px] font-semibold">
          Agregar al carrito
        </button>
      )}
    </div>
  );
}
