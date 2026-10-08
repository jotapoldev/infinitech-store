"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AJUSTES, productoPorId } from "@/lib/mock";
import { formatearPrecio } from "@/lib/precio";
import { armarMensaje, enlaceWhatsapp, PLANTILLA_PEDIDO } from "@/lib/whatsapp";
import { EstadoVacio } from "../EstadoVacio";
import { useCarrito } from "./CarritoProvider";

type Paso = "lista" | "datos" | "enviado";
type Errores = Partial<Record<"nombre" | "telefono" | "zona", string>>;

// Validación en línea: un mensaje por campo, que dice qué falta y cómo arreglarlo.
// Teléfono de El Salvador: 8 dígitos. Si el autocompletado trae +503, se quita.
function soloDigitos(v: string) {
  const d = v.replace(/\D/g, "");
  return (d.length > 8 && d.startsWith("503") ? d.slice(3) : d).slice(0, 8);
}
const conMascara = (v: string) => {
  const d = soloDigitos(v);
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
};

function validar(d: { nombre: string; telefono: string; zona: string }): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 2) e.nombre = "Escribí tu nombre para saber a quién le entregamos.";
  const dig = soloDigitos(d.telefono);
  if (!dig) e.telefono = "Escribí tu teléfono para coordinar la entrega.";
  else if (!/^[267]\d{7}$/.test(dig)) e.telefono = "El teléfono tiene 8 dígitos y empieza con 2, 6 o 7. Ejemplo: 7777-8888.";
  if (d.zona.trim().length < 3) e.zona = "Decinos el municipio o la colonia para calcular la entrega.";
  return e;
}

// Mockup: el número real lo asigna el admin al guardar el pedido.
const numeroDeMuestra = () => `INF-${String(Math.floor(Math.random() * 900) + 100).padStart(6, "0")}`;

const campo =
  "min-h-11 w-full rounded-xl border border-white/14 bg-black/30 px-3.5 text-[16px] outline-none focus:border-acento-claro aria-[invalid=true]:border-[#f9a8d4]";

export function Carrito() {
  const { items, abierto, cerrar, cambiar, cantidadTotal, totalCentavos, vaciar } = useCarrito();
  const reducir = useReducedMotion();
  const [paso, setPaso] = useState<Paso>("lista");
  const [datos, setDatos] = useState({ nombre: "", telefono: "", zona: "", direccion: "", nota: "" });
  const [errores, setErrores] = useState<Errores>({});
  const [numero, setNumero] = useState("");
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  const lineas = items.flatMap((i) => {
    const p = productoPorId(i.productoId);
    return p ? [{ ...i, p }] : [];
  });

  const enviar = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validar(datos);
    setErrores(e);
    if (Object.keys(e).length) return;
    // Mockup: el número lo dará el admin al guardar el pedido (POST /api/pedidos).
    const n = numeroDeMuestra();
    const mensaje = armarMensaje(
      PLANTILLA_PEDIDO,
      n,
      lineas.map((l) => ({ nombre: l.p.nombre, variante: l.variante, cantidad: l.cantidad, precio: l.p.precio })),
      datos,
    );
    // En iOS Safari puede bloquear la pestaña nueva: entonces se abre WhatsApp en la misma.
    const url = enlaceWhatsapp(AJUSTES.whatsapp, mensaje);
    const pestana = window.open(url, "_blank");
    if (pestana) pestana.opener = null;
    else window.location.assign(url);
    setNumero(n);
    setPaso("enviado");
    vaciar();
  };

  const alCerrar = () => {
    cerrar();
    if (paso === "enviado") setPaso("lista");
  };

  // Spring críticamente amortiguado; entra y sale por la derecha (mismo camino).
  const transicion = reducir ? { duration: 0.2 } : { type: "spring" as const, bounce: 0, duration: 0.4 };

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            aria-label="Cerrar carrito"
            onClick={alCerrar}
            className="absolute inset-0 cursor-default bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-carrito"
            className="material relative flex h-full w-full max-w-[420px] flex-col gap-4 border-l border-white/10 !bg-[rgb(33_34_63/0.92)] p-6"
            initial={reducir ? { opacity: 0 } : { x: "100%" }}
            animate={reducir ? { opacity: 1 } : { x: 0 }}
            exit={reducir ? { opacity: 0 } : { x: "100%" }}
            transition={transicion}
          >
            <div className="flex items-center justify-between">
              <h2 id="titulo-carrito" className="text-[22px] font-bold">
                {paso === "datos" ? "Tus datos" : paso === "enviado" ? "¡Pedido enviado!" : "Tu carrito"}
              </h2>
              <button ref={cerrarRef} type="button" onClick={alCerrar} aria-label="Cerrar" className="presionable grid size-11 place-items-center rounded-full bg-white/8">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {paso === "enviado" && (
              <EstadoVacio
                titulo={`Pedido ${numero}`}
                texto="Te escribimos por WhatsApp para coordinar la entrega. Si no se abrió WhatsApp, tocá el botón de abajo."
                acciones={[{ texto: "Abrir WhatsApp", href: `https://wa.me/${AJUSTES.whatsapp}`, externa: true }]}
                ilustracion={
                  <svg viewBox="0 0 64 64" className="size-20" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="32" cy="32" r="26" stroke="#7846d6" />
                    <path d="M20 33l8 8 16-17" />
                  </svg>
                }
              />
            )}

            {paso === "lista" &&
              (lineas.length === 0 ? (
                <EstadoVacio
                  compacto
                  titulo="Tu carrito está vacío."
                  texto="Agregá algo que te guste y lo pedimos por WhatsApp."
                  acciones={[{ texto: "Ver productos", href: "/#productos" }]}
                />
              ) : (
                <>
                  <ul className="flex grow flex-col gap-2.5 overflow-y-auto">
                    {lineas.map((l) => (
                      <li key={`${l.productoId}|${l.variante}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/35 px-3.5 py-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[15px] font-semibold">{l.p.nombre}</span>
                          <span className="text-[13px] text-white/60">
                            {l.variante ? `${l.variante} · ` : ""}
                            {formatearPrecio(l.p.precio)} c/u
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => cambiar(l.productoId, l.variante, -1)} aria-label={`Quitar uno de ${l.p.nombre}`} className="presionable size-11 rounded-full bg-white/8 text-lg">
                            −
                          </button>
                          <span className="min-w-6 text-center font-semibold" aria-live="polite">
                            {l.cantidad}
                          </span>
                          <button type="button" onClick={() => cambiar(l.productoId, l.variante, 1)} aria-label={`Agregar uno de ${l.p.nombre}`} className="presionable size-11 rounded-full bg-white/8 text-lg">
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between border-t border-white/12 pt-3 text-[17px]">
                    <span>{cantidadTotal} artículos</span>
                    <span className="font-bold">Total: {formatearPrecio(totalCentavos)}</span>
                  </div>
                  <button type="button" onClick={() => setPaso("datos")} className="presionable min-h-13 rounded-full bg-acento text-[17px] font-semibold">
                    Continuar
                  </button>
                </>
              ))}

            {paso === "datos" && (
              <form noValidate onSubmit={enviar} className="flex grow flex-col gap-3.5 overflow-y-auto">
                {(
                  [
                    ["nombre", "Nombre", "text", "name"],
                    ["telefono", "Teléfono", "tel", "tel"],
                    ["zona", "Municipio o colonia", "text", "address-level2"],
                  ] as const
                ).map(([k, label, type, auto]) => (
                  <div key={k} className="flex flex-col gap-1.5">
                    <label htmlFor={`f-${k}`} className="text-[14px] text-white/80">
                      {label}
                    </label>
                    <input
                      id={`f-${k}`}
                      type={type}
                      autoComplete={auto}
                      value={datos[k]}
                      aria-invalid={!!errores[k]}
                      aria-describedby={errores[k] ? `e-${k}` : undefined}
                      inputMode={k === "telefono" ? "numeric" : undefined}
                      placeholder={k === "telefono" ? "7777-8888" : undefined}
                      onChange={(e) => {
                        const nuevos = { ...datos, [k]: k === "telefono" ? conMascara(e.target.value) : e.target.value };
                        setDatos(nuevos);
                        // Si el campo ya tenía error, se revalida mientras escribe: el error se va apenas queda bien.
                        if (errores[k]) setErrores((prev) => ({ ...prev, [k]: validar(nuevos)[k] }));
                      }}
                      onBlur={() => setErrores((prev) => ({ ...prev, [k]: validar(datos)[k] }))}
                      className={campo}
                    />
                    {errores[k] && (
                      <span id={`e-${k}`} className="text-[13px] text-[#f9a8d4]">
                        {errores[k]}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="f-direccion" className="text-[14px] text-white/80">
                    Dirección <span className="text-white/50">(opcional)</span>
                  </label>
                  <input id="f-direccion" autoComplete="street-address" value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} className={campo} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="f-nota" className="text-[14px] text-white/80">
                    Nota <span className="text-white/50">(opcional)</span>
                  </label>
                  <textarea id="f-nota" rows={2} value={datos.nota} onChange={(e) => setDatos({ ...datos, nota: e.target.value })} className={`${campo} py-2.5`} />
                </div>
                <div className="mt-auto flex justify-between border-t border-white/12 pt-3 text-[17px]">
                  <button type="button" onClick={() => setPaso("lista")} className="min-h-11 text-acento-claro">
                    ← Volver
                  </button>
                  <span className="self-center font-bold">Total: {formatearPrecio(totalCentavos)}</span>
                </div>
                <button type="submit" className="presionable min-h-13 rounded-full bg-acento text-[17px] font-semibold">
                  Finalizar pedido por WhatsApp
                </button>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
