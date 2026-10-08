import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalogo } from "@/components/Catalogo";
import { Header } from "@/components/Header";
import { Pie } from "@/components/Pie";
import { CATEGORIAS, categoriaDe } from "@/lib/mock";

export const generateStaticParams = () => CATEGORIAS.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const cat = categoriaDe((await params).slug);
  return { title: cat?.nombre ?? "Categoría" };
}

export default async function PaginaCategoria({ params }: PageProps<"/c/[slug]">) {
  const cat = categoriaDe((await params).slug);
  if (!cat) notFound();
  return (
    <>
      <Header />
      <main className="pt-6">
        <Catalogo titulo={cat.nombre} categoriaInicial={cat.slug} />
      </main>
      <Pie />
    </>
  );
}
