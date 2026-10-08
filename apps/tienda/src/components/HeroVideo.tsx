import Image from "next/image";

// Con el admin, el bloque heroVideo trae el video y su imagen de respaldo, y el bloque hero3D
// lo reemplaza por un <model-viewer>.
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
        <div className="relative aspect-[1200/1382] w-full max-w-[600px] [mask-image:radial-gradient(closest-side,#000_82%,transparent_100%)]">
          {/* Sin audio, en loop. Con "reducir movimiento" se muestra la imagen fija. */}
          <video
            className="absolute inset-0 size-full object-cover motion-reduce:hidden"
            src="/marca/audifonos-v3.mp4"
            poster="/marca/audifonos-v3.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Audífonos Infinitech girando"
          />
          <Image src="/marca/audifonos-v3.webp" alt="Audífonos Infinitech" fill priority className="hidden object-cover motion-reduce:block" />
        </div>
      </div>
    </section>
  );
}
