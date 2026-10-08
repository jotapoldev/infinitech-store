// Datos de ejemplo para el mockup. Cuando el admin esté listo, esto se reemplaza por la API de Payload
// con la misma forma (ver packages/tipos).

export type Disponibilidad = "disponible" | "agotado" | "por-encargo";

export type Categoria = { slug: string; nombre: string; icono: string };

export type Variante = { nombre: string; color: string; disponibilidad: Disponibilidad };

export type Producto = {
  id: number;
  slug: string;
  nombre: string;
  categoria: string;
  precio: number; // centavos de USD
  precioAnterior?: number;
  resumen: string;
  destacado?: boolean;
  disponibilidad: Disponibilidad;
  tiempoEncargo?: string;
  variantes?: Variante[];
  especificaciones?: { clave: string; valor: string }[];
};

export type Arte = { id: number; etiqueta: "Nuevo" | "Promoción"; titulo: string; producto?: string };

// Trazos SVG (viewBox 0 0 64 64) del diseño; en el admin cada categoría sube su propio SVG.
export const CATEGORIAS: Categoria[] = [
  { slug: "bocinas", nombre: "Bocinas", icono: '<rect x="18" y="6" width="28" height="52" rx="8"/><circle cx="32" cy="38" r="9"/><circle cx="32" cy="18" r="4"/>' },
  { slug: "barras", nombre: "Barras", icono: '<rect x="4" y="24" width="56" height="16" rx="6"/><path d="M14 32h4M24 32h4M36 32h4M46 32h4"/>' },
  { slug: "audifonos", nombre: "Audífonos", icono: '<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect x="8" y="36" width="10" height="18" rx="4"/><rect x="46" y="36" width="10" height="18" rx="4"/>' },
  { slug: "cargadores", nombre: "Cargadores", icono: '<rect x="18" y="20" width="28" height="30" rx="6"/><path d="M26 20v-10M38 20v-10M32 50v8"/><path d="M33 28l-5 8h8l-5 8"/>' },
  { slug: "power-banks", nombre: "Power banks", icono: '<rect x="16" y="8" width="32" height="48" rx="8"/><path d="M26 18h12M24 46h4M30 46h4M36 46h4"/>' },
  { slug: "cables", nombre: "Cables", icono: '<path d="M14 10v12a6 6 0 0 0 6 6h24a6 6 0 0 1 6 6v20"/><rect x="10" y="4" width="8" height="8" rx="2"/><rect x="46" y="52" width="8" height="8" rx="2"/>' },
];

export const PRODUCTOS: Producto[] = [
  {
    id: 1, slug: "bocina-bluetooth-portatil", nombre: "Bocina Bluetooth portátil", categoria: "bocinas",
    precio: 2999, precioAnterior: 3499, resumen: "Batería de 12 h y resistente al agua.", destacado: true, disponibilidad: "disponible",
    variantes: [
      { nombre: "Negro", color: "#1a1a1a", disponibilidad: "disponible" },
      { nombre: "Morado", color: "#7846d6", disponibilidad: "disponible" },
      { nombre: "Blanco", color: "#f8f7f9", disponibilidad: "agotado" },
    ],
    especificaciones: [{ clave: "Batería", valor: "12 h" }, { clave: "Conexión", valor: "Bluetooth 5.3" }, { clave: "Resistencia", valor: "IPX7" }],
  },
  {
    id: 3, slug: "audifonos-inalambricos", nombre: "Audífonos inalámbricos", categoria: "audifonos",
    precio: 3999, resumen: "Cancelación de ruido y 30 h de batería.", destacado: true, disponibilidad: "disponible",
    variantes: [
      { nombre: "Blanco", color: "#f8f7f9", disponibilidad: "disponible" },
      { nombre: "Negro", color: "#1a1a1a", disponibilidad: "disponible" },
    ],
    especificaciones: [{ clave: "Batería", valor: "30 h" }, { clave: "Cancelación de ruido", valor: "Activa" }],
  },
  { id: 2, slug: "barra-de-sonido", nombre: "Barra de sonido", categoria: "barras", precio: 7999, resumen: "120 W con subwoofer inalámbrico.", disponibilidad: "disponible",
    especificaciones: [{ clave: "Potencia", valor: "120 W" }, { clave: "Entradas", valor: "HDMI ARC, óptica, Bluetooth" }] },
  { id: 4, slug: "cargador-carga-rapida", nombre: "Cargador de carga rápida", categoria: "cargadores", precio: 1499, resumen: "30 W, con puertos USB-C y USB-A.", disponibilidad: "disponible" },
  { id: 5, slug: "power-bank", nombre: "Power bank", categoria: "power-banks", precio: 2499, resumen: "20 000 mAh y dos puertos.", disponibilidad: "agotado" },
  { id: 6, slug: "cable-usb-c-reforzado", nombre: "Cable USB-C reforzado", categoria: "cables", precio: 599, resumen: "1 m de nylon trenzado.", disponibilidad: "disponible" },
  { id: 7, slug: "bocina-para-fiestas", nombre: "Bocina para fiestas", categoria: "bocinas", precio: 9999, resumen: "Luces, micrófono y 60 W.", disponibilidad: "por-encargo", tiempoEncargo: "5 a 7 días" },
  { id: 8, slug: "cable-lightning", nombre: "Cable Lightning", categoria: "cables", precio: 699, resumen: "1 m, compatible con iPhone.", disponibilidad: "disponible" },
];

export const ARTES: Arte[] = [
  { id: 1, etiqueta: "Nuevo", titulo: "Audífonos inalámbricos", producto: "audifonos-inalambricos" },
  { id: 2, etiqueta: "Nuevo", titulo: "Bocina para fiestas", producto: "bocina-para-fiestas" },
  { id: 3, etiqueta: "Promoción", titulo: "Bocina portátil a $29.99", producto: "bocina-bluetooth-portatil" },
  { id: 4, etiqueta: "Nuevo", titulo: "Barra de sonido", producto: "barra-de-sonido" },
  { id: 5, etiqueta: "Promoción", titulo: "Carga rápida", producto: "cargador-carga-rapida" },
];

export const AJUSTES = {
  whatsapp: "50300000000", // ejemplo: el real viene de Ajustes en el admin
};

export const categoriaDe = (slug: string) => CATEGORIAS.find((c) => c.slug === slug);
export const productoDe = (slug: string) => PRODUCTOS.find((p) => p.slug === slug);
export const productoPorId = (id: number) => PRODUCTOS.find((p) => p.id === id);
