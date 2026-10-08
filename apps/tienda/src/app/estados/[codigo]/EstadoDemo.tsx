"use client";

import { useEffect, useState } from "react";
import { accionWhatsapp, PaginaEstado } from "@/components/PaginaEstado";
import { ESTADOS } from "./estados";

export function EstadoDemo({ codigo }: { codigo: keyof typeof ESTADOS }) {
  const [espera, setEspera] = useState(codigo === "429" ? 60 : 0);

  useEffect(() => {
    if (!espera) return;
    const t = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const { titulo, texto } = ESTADOS[codigo];
  const acciones =
    codigo === "403"
      ? [{ texto: "Ir al inicio", href: "/" }]
      : codigo === "429"
        ? [{ texto: espera ? `Reintentar en ${espera} s` : "Reintentar", onClick: () => location.reload(), deshabilitada: espera > 0 }]
        : codigo === "503"
          ? [accionWhatsapp]
          : codigo === "sin-conexion"
            ? [{ texto: "Reintentar", onClick: () => location.reload() }]
            : [{ texto: "Reintentar", onClick: () => location.reload() }, accionWhatsapp];

  return <PaginaEstado codigo={codigo === "sin-conexion" ? "SIN CONEXIÓN" : codigo} titulo={titulo} texto={texto} acciones={acciones} />;
}
