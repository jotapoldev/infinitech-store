"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { productoPorId } from "@/lib/mock";

// El carrito solo guarda qué y cuánto. Nunca precios: el total se calcula con los precios del catálogo.
export type ItemCarrito = { productoId: number; variante: string | null; cantidad: number };

type Contexto = {
  items: ItemCarrito[];
  abierto: boolean;
  cantidadTotal: number;
  totalCentavos: number;
  abrir: () => void;
  cerrar: () => void;
  agregar: (productoId: number, variante: string | null) => void;
  cambiar: (productoId: number, variante: string | null, delta: number) => void;
  vaciar: () => void;
};

const CarritoContext = createContext<Contexto | null>(null);
const CLAVE = "infinitech:carrito";
const MAXIMO = 20;

// Store sobre localStorage: el servidor siempre ve el carrito vacío y el navegador lo hidrata,
// sin desajustes de hidratación. También se sincroniza entre pestañas.
const VACIO: ItemCarrito[] = [];
let cache: ItemCarrito[] | null = null;
const oyentes = new Set<() => void>();

function leer(): ItemCarrito[] {
  if (cache) return cache;
  try {
    cache = (JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as ItemCarrito[]).filter((i) => productoPorId(i.productoId));
  } catch {
    cache = []; // carrito corrupto o storage bloqueado: empezar vacío
  }
  return cache;
}

function escribir(nuevos: ItemCarrito[]) {
  cache = nuevos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevos));
  } catch {
    // modo privado: el carrito vive solo en memoria
  }
  oyentes.forEach((f) => f());
}

function suscribir(f: () => void) {
  oyentes.add(f);
  const enOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      cache = null;
      f();
    }
  };
  window.addEventListener("storage", enOtraPestana);
  return () => {
    oyentes.delete(f);
    window.removeEventListener("storage", enOtraPestana);
  };
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(suscribir, leer, () => VACIO);
  const [abierto, setAbierto] = useState(false);

  const cambiar = useCallback(
    (productoId: number, variante: string | null, delta: number) => {
      const existe = items.find((i) => i.productoId === productoId && i.variante === variante);
      const nuevos = existe
        ? items
            .map((i) => (i === existe ? { ...i, cantidad: Math.min(MAXIMO, i.cantidad + delta) } : i))
            .filter((i) => i.cantidad > 0)
        : delta > 0
          ? [...items, { productoId, variante, cantidad: Math.min(MAXIMO, delta) }]
          : items;
      escribir(nuevos);
    },
    [items],
  );

  const valor = useMemo<Contexto>(() => {
    const totalCentavos = items.reduce((s, i) => s + (productoPorId(i.productoId)?.precio ?? 0) * i.cantidad, 0);
    return {
      items,
      abierto,
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      totalCentavos,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar: (id, variante) => {
        cambiar(id, variante, 1);
        setAbierto(true);
      },
      cambiar,
      vaciar: () => escribir([]),
    };
  }, [items, abierto, cambiar]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito necesita estar dentro de <CarritoProvider>.");
  return ctx;
}
