"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO = "/marca/audifonos-v4.mp4";
const POSTER = "/marca/audifonos-v4.webp";

// Con el admin, el bloque heroVideo trae el video y su imagen de respaldo, y el bloque hero3D
// lo reemplaza por un <model-viewer>.
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  // iOS no reproduce solo en modo de bajo consumo, y con "reducir movimiento" no lo arrancamos nosotros:
  // en esos casos queda el primer cuadro con un botón para reproducir.
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onPlay = () => setPausado(false);
    const onPause = () => setPausado(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
    else v.play().catch(onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <section aria-labelledby="hero-titulo" className="overflow-hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 pt-12 text-center sm:px-6">
        <h1 id="hero-titulo" className="titulo-display text-[40px] sm:text-[64px]">
          Escucha <span className="text-acento-medio">sin límites</span>
        </h1>
        <p className="text-[19px] text-white/72">Audífonos, bocinas y accesorios para cada momento.</p>
      </div>
      <div className="-mt-4 flex justify-center px-4">
        <div className="relative aspect-[1200/1382] w-full max-w-[600px] [mask-image:radial-gradient(closest-side,#000_82%,transparent_100%)]">
          <video
            ref={video}
            className="absolute inset-0 size-full object-cover"
            src={VIDEO}
            poster={POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Audífonos Infinitech girando"
          />
          {pausado && (
            <button
              type="button"
              onClick={() => video.current?.play().catch(() => {})}
              aria-label="Reproducir video"
              className="presionable material absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
