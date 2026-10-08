# Infinitech: tienda en línea y admin

- **Fecha:** 2026-10-07
- **Estado:** aprobado (2026-10-07)
- **Diseño visual de origen:** canvas "Infinitech Tienda" (https://claude.ai/artifact/1KMcBQmW4WoyhY5HpNyBmf)
- **Referencias de estilo:** skill `apple-design` (copia en `docs/referencias/apple-design-SKILL.md`) y el índice de Apple HIG en https://designsystems.surf/design-systems/apple

## 1. Objetivo

Una tienda en línea de tecnología y accesorios (bocinas, barras de sonido, audífonos, cargadores, power banks, cables) para El Salvador, en USD, y un admin separado para manejar el catálogo, la página de inicio y los pedidos.

Lo que pide el negocio: algo novedoso, rápido, seguro, escalable y adaptable. "Adaptable" significa que el admin cambia el contenido y el orden de la página de inicio sin tocar código.

### Fases

1. **Fase 1 (este documento):** tienda pública + admin + pedido por WhatsApp. Cada pedido queda guardado en el admin.
2. **Fase 2:** pago en línea con Wompi (Banco Agrícola). Mientras tanto, el negocio hace la afiliación. Solo cambia el último paso del pedido.

### Fuera del alcance de la fase 1

Pago en línea, cuentas de cliente, inventario por unidades, cupones, varias monedas, facturación electrónica (DTE) automática. Cada uno se agrega cuando haga falta.

## 2. Arquitectura

```
infinitech/                 repo único, pnpm workspaces
  apps/
    tienda/                 Next.js 16 + Tailwind v4, página pública
    admin/                  Payload 3 (sobre Next.js), panel + API
  packages/
    tipos/                  tipos que genera Payload (payload-types.ts), compartidos
  docs/
```

- Dos despliegues separados: `tienda` (dominio principal) y `admin` (subdominio `admin.`).
- La versión de Next.js del admin la define Payload. La tienda va en Next 16 sin depender de eso.
- **Infra, todo en Railway:** servicios `tienda` y `admin`, Postgres y un bucket (compatible con S3) para imágenes, video y modelos 3D.
- **Escalado:** la tienda sirve páginas estáticas a través del CDN de Railway, con réplicas en varias regiones si el tráfico lo pide. El admin no necesita escalar: lo usa el equipo.

### Flujo de datos

1. El admin guarda un producto, una categoría, un arte o la página de inicio.
2. Payload lo guarda en Postgres; los archivos van al bucket.
3. Un hook `afterChange` de Payload llama a `POST /api/revalidate` de la tienda con un secreto compartido (`REVALIDATE_SECRET`). La tienda regenera solo las rutas afectadas.
4. El CDN guarda las páginas con `s-maxage=60, stale-while-revalidate=300`. Un cambio se ve en menos de un minuto.

La tienda lee la API REST de Payload **solo al construir o regenerar páginas**, nunca en cada visita. Los compradores no generan tráfico a la base.

## 3. Modelo de datos (Payload)

Todos los precios van como **enteros en centavos de USD** (`2499` = $24.99).

### Productos

| Campo | Tipo | Regla |
| --- | --- | --- |
| `nombre` | texto | obligatorio |
| `slug` | texto | se genera del nombre, único |
| `categoria` | relación con Categorías | obligatorio |
| `precio` | entero (centavos) | obligatorio, mayor a 0 |
| `precioAnterior` | entero (centavos), opcional | si existe, debe ser mayor que `precio`; la tienda muestra la oferta |
| `resumen` | texto corto | obligatorio, máximo 120 caracteres |
| `descripcion` | texto enriquecido | opcional |
| `fotos` | lista de Media | al menos 1; la primera es la principal |
| `especificaciones` | lista de `{ clave, valor }` | opcional |
| `variantes` | lista de `{ nombre, color (hex), fotos (opcional), disponibilidad }` | opcional; **el precio es el del producto**, igual para todas |
| `disponibilidad` | disponible / agotado / por encargo | se usa si el producto no tiene variantes |
| `tiempoEncargo` | texto corto, opcional | ej. "5 a 7 días"; se muestra si está por encargo |
| `destacado` | sí/no | aparece primero en el catálogo |
| estado | borrador / publicado (drafts de Payload) | la tienda solo lee publicados |

### Categorías

`nombre`, `slug`, `icono` (SVG subido a Media, se muestra en la barra), `orden`.

### Artes ("Lo nuevo")

`imagen` (Media, 1080×1350), `etiqueta` (Nuevo / Promoción), `titulo`, `producto` (relación opcional), `orden`, `activa` (sí/no).

### Media

Colección de subidas de Payload guardada en el bucket. `alt` obligatorio. Tamaños generados automáticamente para tarjetas y galería. Tipos permitidos: imágenes (jpg, png, webp, avif, svg), video (mp4, webm, máximo 30 MB) y modelos 3D (`.glb`, máximo 15 MB).

### Pedidos

| Campo | Tipo |
| --- | --- |
| `numero` | correlativo legible (`INF-000123`) |
| `cliente` | `{ nombre, telefono, zona, direccion (opcional), nota (opcional) }` |
| `lineas` | lista de `{ producto, variante, cantidad, precioUnitario }`, con el precio copiado de la base al momento del pedido |
| `total` | entero (centavos), calculado en el servidor |
| `canal` | whatsapp / wompi |
| `estado` | pendiente → confirmado → enviado → entregado, o cancelado |
| `creado` | fecha |

### Usuarios

Autenticación de Payload. Roles:
- **admin:** todo, incluidos usuarios y Ajustes.
- **editor:** productos, categorías, artes, inicio y pedidos. No usuarios ni Ajustes.

### Ajustes (global)

`whatsapp` (número en formato internacional), `plantillaMensaje`, `redes` (lista de links), `aviso` (texto opcional en una barra superior), `mantenimiento` (sí/no) y `mensajeMantenimiento`.

### Inicio (global, armable con bloques)

Un campo `secciones` de tipo *blocks*. El admin agrega, quita, reordena y edita bloques, con borradores y **vista previa en vivo** antes de publicar.

| Bloque | Campos |
| --- | --- |
| `heroVideo` | título, subtítulo, video (Media), imagen de respaldo (Media) |
| `hero3D` | título, subtítulo, modelo (`.glb`), giro automático sí/no, imagen de respaldo |
| `historiaBocina` | 4 pasos de `{ titulo, texto, formula (opcional) }` |
| `loNuevo` | título; toma las Artes activas por orden |
| `catalogo` | título, categorías a mostrar (vacío = todas), destacados primero sí/no |
| `cierre` | título, texto, botón `{ texto, destino }` |

Bloques iniciales, en este orden: `heroVideo`, `historiaBocina`, `loNuevo`, `catalogo`, `cierre`.

## 4. La tienda

### Rutas

- `/`: header + barra de categorías (fijas) y después los bloques de Inicio en el orden del admin.
- `/p/[slug]`: producto. Galería, selector de variante, precio, especificaciones, agregar al carrito. Metadatos Open Graph para compartir.
- `/c/[slug]`: catálogo filtrado por categoría.
- `/api/revalidate`: solo para el admin, con secreto.
- `/api/pedidos`: crea pedidos (ver 4.3).

Además: `sitemap.xml`, `robots.txt`, datos estructurados `Product` en cada producto.

### 4.1 Composición visual

Sale del canvas, combinando la propuesta B (bocina) y la C (video):

1. **Header translúcido y fijo** con el logo y el botón del carrito con contador (tienda principal).
2. **Barra de categorías con íconos**, fija debajo del header (propuesta C). Los íconos y el orden vienen de Categorías.
3. **Hero con video** "Escucha sin límites" (propuesta C), o el **hero 3D** si el admin lo elige.
4. **Historia de la bocina**: el sólido de revolución que se arma con el scroll en 4 pasos (propuesta B). Se reusa el renderer en canvas 2D del diseño, sin three.js.
5. **Lo nuevo**: carrusel horizontal de artes con snap (propuesta C).
6. **Catálogo**: el de la tienda principal. Filtros por categoría, tarjetas con **2 por fila en móvil**, carrito lateral.
7. **Cierre** y footer.

### 4.2 Estilo

- **Colores del diseño:** fondo `#0a0a0a`, texto `#f8f7f9`, acento `#7846d6`, acento claro `#c7b3f5` / `#9d78ec`, superficie `#21223f`. Se definen como tokens de Tailwind v4.
- **Tipografía:** display en Integral CF con respaldo Archivo Black, en mayúsculas para los títulos grandes. Cuerpo con la fuente del sistema (`system-ui`). Tracking negativo en títulos grandes, cercano a 0 en el cuerpo.
- **Movimiento (skill `apple-design`):** springs con la librería Motion. Por defecto críticamente amortiguados (`bounce: 0`, `duration ≈ 0.3–0.4`); rebote solo en gestos con impulso (carrusel, carrito deslizado). Feedback en el *press* (`scale(0.97)`), animaciones interrumpibles, el carrito entra y sale por el mismo lado.
- **Materiales:** header, barra de categorías y carrito como capas translúcidas (`backdrop-filter: blur(20px) saturate(180%)`), con el contenido pasando por debajo.
- **Accesibilidad:** respeta `prefers-reduced-motion` (la bocina aparece armada, sin springs), `prefers-reduced-transparency` (capas sólidas) y `prefers-contrast: more`. Contraste AA, botones reales, objetivos táctiles de 44 px mínimo, `alt` obligatorio desde el admin.

### 4.3 Carrito y pedido

- El carrito vive en `localStorage`: `{ productoId, varianteNombre, cantidad }[]`. **Nunca guarda precios.**
- Al finalizar, el cliente llena nombre, teléfono, zona, dirección (opcional) y nota (opcional), con validación en línea.
- **Fase 1, WhatsApp:**
  1. La tienda llama a `POST /api/pedidos` con el carrito y los datos del cliente.
  2. El servidor de la tienda valida (zod), busca los productos **publicados** en Payload, rechaza productos o variantes inexistentes o agotados, recalcula el total y crea el Pedido en Payload con una API key de servicio. Devuelve el número de pedido.
  3. La tienda arma el mensaje con la `plantillaMensaje` (número, líneas, variantes, total y datos del cliente) y abre `https://wa.me/<numero>?text=...`.
  4. El carrito se vacía.
- **Fase 2, Wompi:** en el paso 3, en vez de WhatsApp, se crea la transacción en Wompi y el cliente paga en el checkout alojado de Wompi. El pedido pasa a confirmado solo con el webhook de Wompi y su firma verificada. Ningún dato de tarjeta pasa por nuestros servidores.

### 4.4 Rendimiento

- Páginas estáticas con regeneración bajo demanda y CDN.
- La historia de la bocina (canvas), el video y el modelo 3D (`<model-viewer>`) se cargan solo cuando están por entrar en pantalla.
- Video corto, sin audio, en loop, con `poster`.
- Imágenes por `next/image` en AVIF/WebP con tamaños responsivos.
- Objetivo: LCP menor a 2.5 s en móvil 4G y CLS menor a 0.1.

## 5. Seguridad

- La tienda no tiene credenciales de la base. Lee la API pública de Payload, que solo expone contenido publicado (control de acceso `read` en cada colección).
- La única escritura desde afuera es `/api/pedidos`. Lleva validación estricta, límite de tamaño, límite de intentos por IP y, en Payload, un usuario de servicio que solo puede **crear** pedidos.
- Secretos (`PAYLOAD_SECRET`, `REVALIDATE_SECRET`, API key de servicio, credenciales del bucket) solo en variables de entorno de Railway.
- El admin en su propio dominio, con login, roles y bloqueo tras intentos fallidos (nativo de Payload).
- Cabeceras de seguridad en la tienda: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- Los SVG que se suben (íconos de categoría) se sanitizan antes de mostrarse.

## 6. Errores

- **Si el admin o la base se caen:** la tienda sigue sirviendo la última versión generada.
- **Si `/api/pedidos` falla:** igual se abre WhatsApp con el detalle y una línea "(pedido no registrado)". La venta no se pierde.
- **Si el video o el modelo 3D fallan:** se muestra la imagen de respaldo.
- **Validaciones en el admin** (sección 3): no se puede publicar un producto sin precio válido, sin foto o sin `alt`, ni un archivo que exceda el tamaño.
- Mensajes de error específicos: cada uno dice qué falló y cómo arreglarlo.

### 6.1 Páginas de error

Un solo componente `PaginaEstado` (código, título, texto, ilustración y acciones) con el estilo de la tienda: fondo oscuro, la bocina en wireframe como ilustración y botones reales. Cada código tiene su ilustración y su texto:

| Código | Cuándo | Texto principal | Acciones |
| --- | --- | --- | --- |
| 404 | ruta, producto o categoría que no existe o no está publicada (`not-found.tsx`) | "Este producto se nos perdió." | Ver catálogo · Ir al inicio |
| 403 | acceso a una ruta restringida (por ejemplo `/api/revalidate` desde el navegador sin secreto, o una IP bloqueada) | "No tenés acceso a esta página." | Ir al inicio |
| 429 | demasiados intentos en `/api/pedidos` | "Fueron muchos intentos seguidos. Esperá un minuto y volvé a intentarlo." | Reintentar (se activa al terminar la cuenta regresiva) |
| 500 | error inesperado al generar una página (`error.tsx` y `global-error.tsx`) | "Algo falló de nuestro lado." | Reintentar · Escribinos por WhatsApp |
| 503 | modo mantenimiento, activable desde Ajustes (`mantenimiento: sí/no` + mensaje) | el mensaje del admin | Escribinos por WhatsApp |
| sin conexión | el navegador pierde la red al pedir | "Parece que no tenés internet." | Reintentar |

Las rutas de API responden JSON con `{ error: { codigo, mensaje } }` y el código HTTP correcto. La tienda traduce ese JSON a la pantalla o al aviso que corresponda. El admin usa las pantallas de error de Payload.

### 6.2 Estados vacíos y especiales

Cada uno con ilustración propia, un texto que explica qué pasa y una acción concreta:

| Lugar | Estado | Qué se muestra |
| --- | --- | --- |
| Carrito | vacío | "Tu carrito está vacío." + Ver productos |
| Catálogo / categoría | sin productos publicados | "Todavía no hay productos en {categoría}." + Ver todas las categorías |
| Catálogo | sin productos en toda la tienda | "Estamos preparando el catálogo." + WhatsApp |
| Lo nuevo | sin artes activas | el bloque no se muestra |
| Producto | agotado | badge "Agotado", botón deshabilitado con texto "Avisame cuando llegue" que abre WhatsApp |
| Producto | por encargo | badge "Por encargo" y el tiempo estimado si el admin lo indica |
| Variante | agotada | la opción se ve tachada y no se puede elegir |
| Pedido | enviado | pantalla de confirmación con el número de pedido y "Te escribimos por WhatsApp para coordinar la entrega." |
| Carga | mientras llega contenido | esqueletos con la forma de las tarjetas, sin spinners |
| Inicio | sin bloques publicados | catálogo directo, para que la tienda nunca quede en blanco |

## 7. Pruebas

Solo donde un error cuesta dinero o rompe la venta:

- Unitarias (Vitest): cálculo del total (precios de la base, variantes, cantidades, centavos), armado del mensaje de WhatsApp y validación del cuerpo de `/api/pedidos` (rechaza precios enviados por el cliente, productos o variantes inexistentes, cantidades fuera de rango).
- Una prueba de punta a punta (Playwright): abrir la tienda, agregar un producto con variante, finalizar el pedido y verificar que el pedido existe en Payload con el total correcto.

## 8. Requisitos del negocio (fuera del código)

Verificar con un contador o abogado:

- Registro del negocio (NIT, IVA) y cuenta bancaria para la afiliación a Wompi.
- Facturación electrónica (DTE) del Ministerio de Hacienda.
- Ley de Protección al Consumidor: precios con IVA, política de devoluciones y datos de contacto visibles.
- Aviso de privacidad, porque se guardan nombre, teléfono y dirección.

## 9. Pendientes de datos

- Catálogo real (nombres, precios, fotos, variantes, categorías). Mientras tanto se cargan los 8 productos de ejemplo del diseño.
- Número de WhatsApp.
- Video del hero y, si se usa, el modelo `.glb`.
- Logo en SVG y la licencia de la fuente Integral CF (es de pago). Si no hay licencia, se usa Archivo Black.
- Dominio.
