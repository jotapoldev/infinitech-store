// Datos de ejemplo para el mockup. Cuando el admin esté listo, esto se reemplaza por la API de Payload
// con la misma forma (ver packages/tipos).

export type Disponibilidad = "disponible" | "agotado" | "por-encargo";

export type Categoria = { slug: string; nombre: string; icono: string };

export type Variante = { nombre: string; color: string; disponibilidad: Disponibilidad };

export type Producto = {
  id: number;
  slug: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number; // centavos de USD
  precioAnterior?: number;
  resumen: string;
  destacado?: boolean;
  disponibilidad: Disponibilidad;
  tiempoEncargo?: string;
  variantes?: Variante[];
  especificaciones?: { clave: string; valor: string }[];
  imagen: string;
};

export type Arte = { id: number; etiqueta: "Nuevo" | "Promoción"; titulo: string; imagen: string; producto?: string; conTexto?: boolean };

// Trazos SVG (viewBox 0 0 64 64); en el admin cada categoría sube su propio SVG.
export const CATEGORIAS: Categoria[] = [
  { slug: "bocinas", nombre: "Bocinas", icono: '<rect x="18" y="6" width="28" height="52" rx="8"/><circle cx="32" cy="38" r="9"/><circle cx="32" cy="18" r="4"/>' },
  { slug: "barras", nombre: "Barras", icono: '<rect x="4" y="24" width="56" height="16" rx="6"/><path d="M14 32h4M24 32h4M36 32h4M46 32h4"/>' },
  { slug: "audifonos", nombre: "Audífonos", icono: '<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect x="8" y="36" width="10" height="18" rx="4"/><rect x="46" y="36" width="10" height="18" rx="4"/>' },
  { slug: "power-banks", nombre: "Power banks", icono: '<rect x="16" y="8" width="32" height="48" rx="8"/><path d="M26 18h12M24 46h4M30 46h4M36 46h4"/>' },
  { slug: "hogar", nombre: "Hogar", icono: '<path d="M8 30L32 10l24 20"/><path d="M14 26v28h36V26"/><rect x="27" y="38" width="10" height="16" rx="2"/>' },
  { slug: "auto", nombre: "Auto", icono: '<path d="M10 40l5-14a6 6 0 0 1 6-4h22a6 6 0 0 1 6 4l5 14"/><rect x="6" y="38" width="52" height="12" rx="4"/><circle cx="18" cy="50" r="5"/><circle cx="46" cy="50" r="5"/>' },
];

// Productos de la demo con fotos reales. Los precios son de ejemplo hasta tener los reales.
export const PRODUCTOS: Producto[] = [
  { id: 1, slug: "bocina-cubo-rgb", nombre: "Bocina cubo RGB", marca: "Ewtto", categoria: "bocinas", precio: 3499, resumen: "Bocina portátil con anillo de luz RGB y controles táctiles.", destacado: true, disponibilidad: "disponible", imagen: "/productos/bocina-cubo-rgb.webp" },
  { id: 2, slug: "audifonos-tws-mini-malista", nombre: "Audífonos TWS Mini Malista", marca: "Ewtto", categoria: "audifonos", precio: 2499, resumen: "Diseño metálico y sonido brutalmente nítido.", destacado: true, disponibilidad: "disponible", imagen: "/productos/audifonos-tws-mini-malista.webp" },
  { id: 3, slug: "bocina-jvc-boombox", nombre: "Bocina JVC Boombox", marca: "JVC", categoria: "bocinas", precio: 8999, resumen: "Bocina tipo boombox con asa y luz frontal.", destacado: true, disponibilidad: "disponible", imagen: "/productos/bocina-jvc-boombox.webp" },
  { id: 4, slug: "power-bank-35w-2en1", nombre: "Power bank 2 en 1 de 35 W", marca: "Ewtto", categoria: "power-banks", precio: 3999, resumen: "Power bank y cubo cargador en uno, con carga rápida de 35 W.", disponibilidad: "disponible", imagen: "/productos/power-bank-35w-2en1.webp" },
  { id: 5, slug: "bocinas-rgb-siaowe-par", nombre: "Par de bocinas RGB", marca: "Siaowe", categoria: "bocinas", precio: 4999, resumen: "Dos bocinas con anillo de luz RGB.", disponibilidad: "disponible", imagen: "/productos/bocinas-rgb-siaowe-par.webp" },
  { id: 6, slug: "bocina-portatil-calaveras", nombre: "Bocina portátil Calaveras", marca: "Ewtto", categoria: "bocinas", precio: 2999, resumen: "Bocina portátil con estampado de calaveras y correa.", disponibilidad: "disponible", imagen: "/productos/bocina-portatil-calaveras.webp" },
  { id: 7, slug: "barra-de-sonido", nombre: "Barra de sonido", marca: "Ewtto", categoria: "barras", precio: 5999, resumen: "Barra de sonido compacta con luz ambiental.", disponibilidad: "disponible", imagen: "/productos/barra-de-sonido.webp" },
  { id: 8, slug: "timbre-camara-pantalla", nombre: "Timbre con cámara y pantalla", marca: "Ewtto", categoria: "hogar", precio: 6999, resumen: "Timbre inalámbrico con cámara y monitor para ver quién llega.", disponibilidad: "disponible", imagen: "/productos/timbre-camara-pantalla.webp" },
  { id: 9, slug: "horno-tostador", nombre: "Horno tostador", marca: "Ewtto", categoria: "hogar", precio: 5499, resumen: "Horno tostador compacto con temporizador.", disponibilidad: "disponible", imagen: "/productos/horno-tostador.webp" },
  { id: 10, slug: "arrancador-bateria-et-h9003", nombre: "Arrancador de batería ET-H9003", marca: "Ewtto", categoria: "auto", precio: 7999, resumen: "Arrancador portátil para batería de carro, con pinzas y estuche.", disponibilidad: "disponible", imagen: "/productos/arrancador-bateria-et-h9003.webp" },
];

export const ARTES: Arte[] = [
  { id: 1, etiqueta: "Nuevo", titulo: "Audífonos Mini Malista", imagen: "/artes/mini-malista.webp", producto: "audifonos-tws-mini-malista", conTexto: true },
  { id: 2, etiqueta: "Promoción", titulo: "Carga rápida de 35 W", imagen: "/artes/carga-rapida-35w.webp", producto: "power-bank-35w-2en1", conTexto: true },
  { id: 3, etiqueta: "Nuevo", titulo: "Bocinas RGB Siaowe", imagen: "/artes/siaowe-ambiente-1.webp", producto: "bocinas-rgb-siaowe-par" },
  { id: 4, etiqueta: "Nuevo", titulo: "Luz y sonido en par", imagen: "/artes/siaowe-ambiente-2.webp", producto: "bocinas-rgb-siaowe-par" },
];

export const AJUSTES = {
  whatsapp: "50379165515", // temporal; el de Infinitech es 50379295020. Con el admin, viene de Ajustes
};

export const categoriaDe = (slug: string) => CATEGORIAS.find((c) => c.slug === slug);
export const productoDe = (slug: string) => PRODUCTOS.find((p) => p.slug === slug);
export const productoPorId = (id: number) => PRODUCTOS.find((p) => p.id === id);
