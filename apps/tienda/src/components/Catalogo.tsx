"use client";

import { useState } from "react";
import { AJUSTES, CATEGORIAS, PRODUCTOS } from "@/lib/mock";
import { EstadoVacio } from "./EstadoVacio";
import { TarjetaProducto } from "./TarjetaProducto";

export function Catalogo({ titulo = "Productos", categoriaInicial = "todos" }: { titulo?: string; categoriaInicial?: string }) {
  const [cat, setCat] = useState(categoriaInicial);
  const filtros = [{ slug: "todos", nombre: "Todos" }, ...CATEGORIAS];
  const productos = PRODUCTOS.filter((p) => cat === "todos" || p.categoria === cat).sort(
    (a, b) => Number(!!b.destacado) - Number(!!a.destacado),
  );
  const nombreCat = CATEGORIAS.find((c) => c.slug === cat)?.nombre;

  return (
    <section id="productos" aria-labelledby="titulo-productos" className="mx-auto flex max-w-[1200px] scroll-mt-40 flex-col gap-7 px-4 pt-6 pb-18 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="titulo-productos" className="titulo-display text-[28px] sm:text-[34px]">
          {titulo}
        </h2>
        <span className="text-[15px] text-white/60">{productos.length} productos</span>
      </div>

      <div role="group" aria-label="Filtrar por categoría" className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filtros.map((f) => (
          <button
            key={f.slug}
            type="button"
            aria-pressed={cat === f.slug}
            onClick={() => setCat(f.slug)}
            className={`presionable min-h-11 shrink-0 rounded-full border px-5 text-[15px] ${
              cat === f.slug ? "border-acento bg-acento font-semibold" : "border-white/16 bg-white/4 text-white/85"
            }`}
          >
            {f.nombre}
          </button>
        ))}
      </div>

      {productos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:gap-5">
          {productos.map((p) => (
            <TarjetaProducto key={p.id} p={p} />
          ))}
        </div>
      ) : nombreCat ? (
        <EstadoVacio
          titulo={`Todavía no hay productos en ${nombreCat}.`}
          texto="Estamos por traer más. Mirá las otras categorías o escribinos y te avisamos cuando lleguen."
          acciones={[{ texto: "Ver todas las categorías", href: "/#productos" }]}
        />
      ) : (
        <EstadoVacio
          titulo="Estamos preparando el catálogo."
          texto="Muy pronto vas a ver los productos aquí."
          acciones={[{ texto: "Escribinos por WhatsApp", href: `https://wa.me/${AJUSTES.whatsapp}`, externa: true }]}
        />
      )}
    </section>
  );
}
