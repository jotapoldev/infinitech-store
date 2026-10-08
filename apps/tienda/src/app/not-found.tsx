import { Header } from "@/components/Header";
import { PaginaEstado } from "@/components/PaginaEstado";
import { Pie } from "@/components/Pie";

export default function NoEncontrado() {
  return (
    <>
      <Header conCategorias={false} />
      <PaginaEstado
        codigo="404"
        titulo="Este producto se nos perdió."
        texto="La página que buscás no existe o el producto ya no está disponible. Revisá el catálogo, seguro hay algo parecido."
        acciones={[
          { texto: "Ver catálogo", href: "/#productos" },
          { texto: "Ir al inicio", href: "/" },
        ]}
      />
      <Pie />
    </>
  );
}
