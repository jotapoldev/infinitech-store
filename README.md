# Infinitech · tienda en línea

Tienda en línea de tecnología y accesorios para El Salvador (precios en USD) y su panel de administración.

**Demo:** https://tienda-production-6a06.up.railway.app

> Estado: **mockup navegable** con productos reales y datos de ejemplo (precios de ejemplo). El admin está diseñado y planificado, pero todavía no está construido.

## Qué hay

| Carpeta | Qué es | Estado |
| --- | --- | --- |
| `apps/tienda` | Tienda pública en Next.js 16 + Tailwind v4 | mockup en línea |
| `apps/admin` | Panel en Payload 3 (catálogo, inicio por bloques, pedidos) | por construir (Plan 1) |
| `packages/tipos` | Tipos compartidos que genera Payload | por construir |
| `docs/superpowers/specs` | Diseño completo del sistema | aprobado |
| `docs/superpowers/plans` | Plan de implementación del admin | listo |
| `.railway/railway.ts` | Infraestructura en Railway (infraestructura como código) | en uso |

## La tienda hoy

- Inicio: barra de categorías con íconos, hero animado, "Lo nuevo" con artes, catálogo (2 por fila en celular) y cierre.
- Página de producto (`/p/[slug]`) y de categoría (`/c/[slug]`).
- Carrito en el navegador (`localStorage`, nunca guarda precios) y pedido por **WhatsApp** con el mensaje armado.
- Formulario con validación en línea y máscara de teléfono (`7777-8888`, acepta `+503`).
- Páginas de error y estados vacíos: 404, 500 y vistas de muestra en `/estados/403`, `/estados/429`, `/estados/500`, `/estados/503` y `/estados/sin-conexion`.
- Respeta "reducir movimiento", "reducir transparencia" y "más contraste" del sistema.

Los datos viven en `apps/tienda/src/lib/mock.ts` hasta que exista el admin.

## Desarrollo

Requisitos: Node 20.9 o superior y pnpm.

```bash
pnpm install
pnpm dev:tienda        # http://localhost:3000
```

Otros comandos:

```bash
pnpm --filter tienda build
node apps/tienda/tests/telefono.test.mjs
```

## Despliegue

- Cada push a `main` despliega la tienda en Railway (proyecto `infinitech-mockup`, servicio `tienda`).
- La configuración del servicio está en `.railway/railway.ts`. Para revisarla y aplicarla: `railway config plan` y `railway config apply`.

## Próximos pasos

1. Construir el admin (`docs/superpowers/plans/2026-10-07-infinitech-admin.md`): Payload 3 + Postgres + bucket en Railway.
2. Plan 2: conectar la tienda a la API del admin (productos, inicio por bloques, pedidos guardados).
3. Fase 2: pago en línea con Wompi.
