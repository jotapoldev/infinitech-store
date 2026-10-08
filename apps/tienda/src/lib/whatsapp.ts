import { formatearPrecio } from "./precio";

export const PLANTILLA_PEDIDO = `Hola, quiero hacer este pedido:

Pedido {numero}
{lineas}

Total: {total}

Nombre: {nombre}
Teléfono: {telefono}
Zona: {zona}
Dirección: {direccion}
Nota: {nota}`;

export type LineaMensaje = { nombre: string; variante: string | null; cantidad: number; precio: number };
export type DatosCliente = { nombre: string; telefono: string; zona: string; direccion?: string; nota?: string };

export function armarMensaje(plantilla: string, numero: string, lineas: LineaMensaje[], cliente: DatosCliente) {
  const texto = lineas
    .map((l) => `• ${l.cantidad} × ${l.nombre}${l.variante ? ` (${l.variante})` : ""}: ${formatearPrecio(l.precio * l.cantidad)}`)
    .join("\n");
  const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const valores: Record<string, string> = {
    numero,
    lineas: texto,
    total: formatearPrecio(total),
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    zona: cliente.zona,
    direccion: cliente.direccion || "—",
    nota: cliente.nota || "—",
  };
  return plantilla.replace(/\{(\w+)\}/g, (m, k: string) => valores[k] ?? m);
}

export const enlaceWhatsapp = (numero: string, mensaje: string) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
