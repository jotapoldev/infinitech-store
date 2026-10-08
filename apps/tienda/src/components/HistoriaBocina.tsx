"use client";

import { useEffect, useRef, useState } from "react";
import { PASOS_BOCINA } from "@/lib/mock";
import { ajustarCanvas, dibujarTorno, estadoPara, pasoPara } from "@/lib/torno";

export function HistoriaBocina() {
  const seccion = useRef<HTMLElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [paso, setPaso] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    let p = reducir ? 1 : 0;
    let idle = 0;
    let ultimo = performance.now();

    const dibujar = () => {
      const c = lienzo.current;
      const g = c && ajustarCanvas(c);
      if (g) dibujarTorno(g.ctx, g.W, g.H, estadoPara(p, idle));
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      let objetivo = p;
      if (seccion.current && escenario.current) {
        const r = seccion.current.getBoundingClientRect();
        const total = r.height - escenario.current.getBoundingClientRect().height;
        if (total > 0) objetivo = Math.max(0, Math.min(1, -r.top / total));
      }
      p += (objetivo - p) * Math.min(1, dt * 8);
      idle += dt * 0.35 * Math.max(0, Math.min(1, (p - 0.56) / 0.26));
      setPaso(pasoPara(p));
      setPct(Math.round(p * 100));
      dibujar();
      if (visible) raf = requestAnimationFrame(tick);
    };

    if (reducir) {
      // Sin animación: la bocina aparece armada y los pasos se leen como lista.
      raf = requestAnimationFrame(() => {
        setPaso(3);
        dibujar();
      });
      return () => cancelAnimationFrame(raf);
    }

    // Solo anima mientras la sección está en pantalla.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        ultimo = performance.now();
        raf = requestAnimationFrame(tick);
      } else cancelAnimationFrame(raf);
    });
    if (seccion.current) io.observe(seccion.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const actual = PASOS_BOCINA[paso];

  return (
    <section ref={seccion} aria-label="Cómo nace una bocina Infinitech" className="relative h-[320vh] motion-reduce:h-auto">
      <div ref={escenario} className="sticky top-[var(--alto-header)] h-[min(calc(100svh-var(--alto-header)),820px)] overflow-hidden motion-reduce:static">
        <canvas
          ref={lienzo}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[calc(100%-230px)] w-full sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-[62%]"
        />
        <div
          aria-live="polite"
          className="absolute inset-x-5 bottom-7 flex flex-col gap-3.5 sm:inset-x-auto sm:bottom-auto sm:left-[max(24px,calc(50%-576px))] sm:top-1/2 sm:w-[min(400px,40%)] sm:-translate-y-1/2"
        >
          <span className="text-sm tracking-wide text-acento-claro">0{paso + 1} / 04</span>
          <h2 className="titulo-display text-[30px] sm:text-[44px]">{actual.titulo}</h2>
          <p className="text-[17px] leading-relaxed text-white/72">{actual.texto}</p>
          {actual.formula && (
            <span className="self-start rounded-xl border border-acento/40 bg-acento/18 px-3.5 py-2 font-mono text-[15px] text-[#e4d9fb]">
              {actual.formula}
            </span>
          )}
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {PASOS_BOCINA.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === paso ? "w-7 bg-acento" : "w-3 bg-white/20"}`} />
            ))}
          </div>
        </div>
        {pct < 3 && (
          <span className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[13px] text-white/60 sm:inline-flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
            desliza hacia abajo
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/6" aria-hidden="true">
          <div className="h-full bg-acento" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  );
}
