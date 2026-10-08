"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS } from "@/lib/mock";
import { useCarrito } from "./carrito/CarritoProvider";
import { Icono } from "./Icono";

export function Header({ conCategorias = true }: { conCategorias?: boolean }) {
  const { cantidadTotal, abrir } = useCarrito();

  return (
    <header className="material sticky top-0 z-30 border-b border-white/8">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="Infinitech, inicio" className="flex min-h-11 items-center">
          <Image src="/marca/logo.png" alt="Infinitech — Tecnología y accesorios" width={1090} height={300} priority className="h-9 w-auto" />
        </Link>
        <button
          type="button"
          onClick={abrir}
          aria-label={`Abrir carrito, ${cantidadTotal} artículos`}
          className="presionable flex min-h-11 items-center gap-2.5 rounded-full border border-white/16 bg-white/6 px-4 text-[15px]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7z" />
            <path d="M9 7V6a3 3 0 0 1 6 0v1" />
          </svg>
          <span className="hidden sm:inline">Carrito</span>
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-acento px-1.5 text-[13px] font-bold">
            {cantidadTotal}
          </span>
        </button>
      </div>

      {conCategorias && (
        <nav aria-label="Categorías" className="border-t border-white/6">
          <ul className="sin-scrollbar mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-2.5 sm:justify-center sm:px-6">
            {CATEGORIAS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/c/${c.slug}`}
                  className="presionable flex min-h-16 min-w-22 flex-col items-center gap-1.5 rounded-2xl px-2 py-1 text-[13px] text-white/72 hover:text-white"
                >
                  <Icono trazos={c.icono} className="size-7" />
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
