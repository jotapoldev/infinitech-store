import Image from "next/image";
import Link from "next/link";
import { AJUSTES } from "@/lib/mock";

export function Cierre() {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-[18px] px-4 py-18 text-center sm:px-6">
      <h2 className="titulo-display text-[34px] sm:text-[44px]">Encuentra el tuyo</h2>
      <p className="max-w-[520px] text-[19px] text-white/72">Bocinas, barras de sonido, cargadores y accesorios para tu día a día.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/#productos" className="presionable inline-flex min-h-[50px] items-center rounded-full bg-acento px-7 text-[17px] font-semibold">
          Ver productos
        </Link>
        <a
          href={`https://wa.me/${AJUSTES.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="presionable inline-flex min-h-[50px] items-center rounded-full border border-white/24 px-7 text-[17px] font-semibold"
        >
          Escríbenos
        </a>
      </div>
    </section>
  );
}

export function Pie() {
  return (
    <footer id="contacto" className="border-t border-white/8">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-between gap-8 px-4 pt-14 pb-10 sm:px-6">
        <div className="flex flex-col gap-3.5">
          <Image src="/marca/logo.png" alt="Infinitech" width={1090} height={300} className="h-12 w-auto self-start" />
          <p className="text-[15px] text-white/60">© 2026 Infinitech. Todos los derechos reservados.</p>
        </div>
        <div className="flex flex-col gap-2 text-[15px]">
          <span className="font-semibold">Contacto</span>
          <a href={`https://wa.me/${AJUSTES.whatsapp}`} target="_blank" rel="noreferrer" className="text-acento-claro hover:text-white">
            WhatsApp
          </a>
          <span className="text-white/70">[Dirección o punto de entrega]</span>
        </div>
      </div>
    </footer>
  );
}
