import Image from "next/image";

// Mockup: el "video" es la animación webp del diseño. Con el admin, el bloque heroVideo trae un mp4/webm
// con su imagen de respaldo, y el bloque hero3D lo reemplaza por un <model-viewer>.
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
        <div className="relative aspect-[480/544] w-full max-w-[600px] [mask-image:radial-gradient(closest-side,#000_62%,rgba(0,0,0,0.6)_80%,transparent_100%)]">
          <Image src="/marca/audifonos.webp" alt="Audífonos Infinitech girando" fill priority unoptimized className="object-cover" />
        </div>
      </div>
    </section>
  );
}
