import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { EstadoDemo } from "./EstadoDemo";
import { ESTADOS } from "./estados";

// Vista de muestra de las pantallas de estado para revisarlas con el cliente.
export const generateStaticParams = () => Object.keys(ESTADOS).map((codigo) => ({ codigo }));

export default async function PaginaEstadoDemo({ params }: PageProps<"/estados/[codigo]">) {
  const { codigo } = await params;
  if (!(codigo in ESTADOS)) notFound();
  return (
    <>
      <Header conCategorias={false} />
      <EstadoDemo codigo={codigo as keyof typeof ESTADOS} />
    </>
  );
}
