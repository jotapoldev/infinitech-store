// Es <img> y no next/image porque el optimizador lo dejaría estático.
// Animación del hero como WebP animado y no como <video>: iOS bloquea la reproducción automática de
// video en modo de bajo consumo, pero las imágenes animadas siempre corren.
// Con "reducir movimiento" el navegador elige la imagen fija. Con el admin, este bloque es heroVideo / hero3D.
export function HeroVideo() {
  return (
    <section aria-labelledby="hero-titulo" className="overflow-hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 pt-12 text-center sm:px-6">
        <h1 id="hero-titulo" className="titulo-display text-[40px] sm:text-[64px]">
          Escucha <span className="text-acento-medio">sin límites</span>
        </h1>
        <p className="text-[19px] text-white/72">Audífonos, bocinas y accesorios para cada momento.</p>
      </div>
      <div className="-mt-4 flex justify-center px-4">
        <div className="relative aspect-[720/830] w-full max-w-[600px] [mask-image:radial-gradient(closest-side,#000_82%,transparent_100%)]">
          <picture>
            <source media="(prefers-reduced-motion: reduce)" srcSet="/marca/audifonos-v5-fijo.webp" />
            <img
              src="/marca/audifonos-v5.webp"
              alt="Audífonos Infinitech girando"
              width={720}
              height={830}
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
