import { Catalogo } from "@/components/Catalogo";
import { Header } from "@/components/Header";
import { HeroVideo } from "@/components/HeroVideo";
import { LoNuevo } from "@/components/LoNuevo";
import { Cierre, Pie } from "@/components/Pie";

// Orden de bloques por defecto del spec. Con el admin, este orden viene del global "inicio".
export default function Inicio() {
  return (
    <>
      <Header />
      <main>
        <HeroVideo />
        <LoNuevo />
        <Catalogo />
        <Cierre />
      </main>
      <Pie />
    </>
  );
}
