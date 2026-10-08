import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Pie } from "@/components/Pie";
import { Insignia } from "@/components/TarjetaProducto";
import { categoriaDe, PRODUCTOS, productoDe } from "@/lib/mock";
import { formatearPrecio } from "@/lib/precio";
import { Comprar } from "./Comprar";

export const generateStaticParams = () => PRODUCTOS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const p = productoDe((await params).slug);
  return p ? { title: p.nombre, description: `${p.resumen} ${formatearPrecio(p.precio)}.` } : { title: "Producto" };
}

export default async function PaginaProducto({ params }: PageProps<"/p/[slug]">) {
  const p = productoDe((await params).slug);
  if (!p) notFound();
  const cat = categoriaDe(p.categoria);

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-2">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[32px] border border-white/8 bg-superficie">
          <div className="absolute size-[70%] rounded-full bg-acento/35 blur-[60px]" aria-hidden="true" />
          <Image src={p.imagen} alt={p.nombre} width={1000} height={1000} priority sizes="(max-width: 768px) 100vw, 600px" className="relative size-[88%] object-contain" />
          <span className="absolute top-5 right-5">
            <Insignia p={p} />
          </span>
        </div>
        <div className="flex flex-col gap-5">
          <nav aria-label="Ruta" className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">Inicio</Link> /{" "}
            {cat && <Link href={`/c/${cat.slug}`} className="hover:text-white">{cat.nombre}</Link>}
          </nav>
          <span className="text-sm tracking-wide text-acento-claro uppercase">{p.marca}</span>
          <h1 className="titulo-display -mt-3 text-[34px] sm:text-[48px]">{p.nombre}</h1>
          <p className="text-[19px] text-white/72">{p.resumen}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-[32px] font-bold">{formatearPrecio(p.precio)}</span>
            {p.precioAnterior && <s className="text-lg text-white/45">{formatearPrecio(p.precioAnterior)}</s>}
          </div>
          {p.disponibilidad === "por-encargo" && p.tiempoEncargo && (
            <p className="rounded-2xl border border-acento/40 bg-acento/12 px-4 py-3 text-[15px] text-acento-claro">
              Por encargo: llega en {p.tiempoEncargo}.
            </p>
          )}
          <Comprar p={p} />
          {p.especificaciones?.length ? (
            <dl className="mt-4 divide-y divide-white/8 rounded-2xl border border-white/8 bg-tarjeta">
              {p.especificaciones.map((e) => (
                <div key={e.clave} className="flex justify-between gap-4 px-5 py-3.5 text-[15px]">
                  <dt className="text-white/60">{e.clave}</dt>
                  <dd className="text-right font-medium">{e.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </main>
      <Pie />
    </>
  );
}
