"use client";

import { useEffect } from "react";
import { accionWhatsapp, PaginaEstado } from "@/components/PaginaEstado";

export default function ErrorTienda({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PaginaEstado
      codigo="500"
      titulo="Algo falló de nuestro lado."
      texto="No es tu culpa. Volvé a intentarlo en un momento; si sigue pasando, escribinos y te ayudamos con tu pedido."
      acciones={[{ texto: "Reintentar", onClick: retry }, accionWhatsapp]}
    />
  );
}
