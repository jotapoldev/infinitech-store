# Infinitech Admin (Plan 1 de 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo `infinitech` con el admin en Payload 3: colecciones, globals, control de acceso, pedidos con precios fijados en el servidor, aviso de revalidación a la tienda y datos de ejemplo.

**Architecture:** pnpm workspace con `apps/admin` (Payload 3.90.2 sobre Next 16) y `packages/tipos` (tipos generados por Payload). Postgres de desarrollo en Railway (no hay Docker local). Archivos en disco en desarrollo y en un bucket S3 de Railway en producción. Toda la lógica que decide algo (validaciones, acceso, precios, tags de revalidación, sanitizado de SVG) vive en funciones puras en `src/lib` y `src/access`, probadas con Vitest; las colecciones solo las conectan.

**Tech Stack:** Node 24, pnpm 12, Payload 3.90.2, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`, `@payloadcms/richtext-lexical`, Next 16.3.3+, Vitest 4, `isomorphic-dompurify`, sharp.

**Spec:** `docs/superpowers/specs/2026-10-07-infinitech-tienda-design.md` (secciones 2, 3, 5, 6 y 9). La tienda (sección 4) es el Plan 2.

## Global Constraints

- Precios como **enteros en centavos de USD** (`2499` = $24.99). Nunca decimales.
- La tienda solo puede leer contenido **publicado**; los borradores solo los ve el equipo.
- Roles: `admin` (todo), `editor` (productos, categorías, artes, inicio, pedidos; no usuarios ni ajustes), `servicio` (solo crear pedidos, por API key).
- `alt` obligatorio en toda Media. Límites: video mp4/webm ≤ 30 MB, modelo `.glb` ≤ 15 MB, imagen ≤ 10 MB.
- Mensajes de error específicos: dicen qué falló y cómo arreglarlo, en español.
- Todo el texto visible en el admin, en español.
- Commits en Conventional Commits, en español, **sin** líneas `Co-Authored-By` ni "Generated with Claude Code".
- No crear recursos en Railway ni desplegar sin confirmación explícita del usuario.

## Review Focus

- Precio escrito en dólares (`24.99`) en vez de centavos: debe rechazarse con un mensaje que muestre el ejemplo correcto, no guardarse como 24 centavos. Test en Task 2.
- Pedido que incluye un producto en borrador, agotado, inexistente o una variante que no existe, o que trae un precio inventado desde el cliente: el servidor lo rechaza o ignora el precio enviado. Test en Task 7.
- Dos productos con nombres que solo difieren en tildes o ñ ("Bocina Ñandú" / "Bocina Nandu"): el slug sale sin tildes y la base rechaza el duplicado con mensaje claro. Test del slug en Task 2.
- SVG de ícono con `<script>` u `onload`: se guarda sin el código. Test en Task 4.
- Tienda caída o sin `TIENDA_URL` cuando el admin publica: la publicación termina bien y el aviso falla en silencio con un log. Test en Task 5.

---

## Estructura de archivos

```
infinitech/
  package.json                      scripts raíz
  pnpm-workspace.yaml
  apps/admin/
    .env.example
    package.json                    (modificado del template)
    vitest.config.mts               (reemplazado: entorno node, tests/unit)
    src/payload.config.ts           (reemplazado)
    src/access/index.ts             reglas de acceso por rol
    src/lib/slug.ts                 slugify + campoSlug
    src/lib/validaciones.ts         precio, precio anterior, color, teléfono, WhatsApp
    src/lib/pedidos.ts              formatearNumero, armarLineas (precios desde la base)
    src/lib/archivos.ts             límites de tamaño por tipo + hook
    src/lib/svg.ts                  sanitizarSvg
    src/lib/revalidar.ts            tagsPara, notificarTienda, hooks
    src/collections/Usuarios.ts
    src/collections/Media.ts
    src/collections/Categorias.ts
    src/collections/Productos.ts
    src/collections/Artes.ts
    src/collections/Pedidos.ts
    src/globals/Ajustes.ts
    src/globals/Inicio.ts
    src/globals/bloques.ts          bloques de la página de inicio
    src/seed/index.ts               datos de ejemplo (idempotente)
    src/seed/datos.ts
    tests/unit/*.spec.ts
  packages/tipos/
    package.json
    src/payload-types.ts            generado por Payload
    src/index.ts
```

---

### Task 1: Monorepo y esqueleto del admin

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`
- Create (scaffold): `apps/admin/**` con `create-payload-app`
- Delete: `apps/admin/.git`, `apps/admin/src/app/(frontend)`, `apps/admin/src/app/my-route`, `apps/admin/tests/int`, `apps/admin/tests/e2e`, `apps/admin/tests/helpers`, `apps/admin/docker-compose.yml`, `apps/admin/playwright.config.ts`, `apps/admin/test.env`, `apps/admin/vitest.setup.ts`
- Modify: `apps/admin/package.json`, `apps/admin/vitest.config.mts`, `apps/admin/.env.example`
- Test: `apps/admin/tests/unit/humo.spec.ts`

**Interfaces:**
- Produces: `pnpm --filter admin dev` levanta el admin en `http://localhost:3001/admin`; `pnpm --filter admin test:unit` corre Vitest sobre `tests/unit/**/*.spec.ts`.

- [ ] **Step 1: Crear la raíz del workspace**

`package.json`:
```json
{
  "name": "infinitech",
  "private": true,
  "packageManager": "pnpm@12.3.4",
  "scripts": {
    "dev:admin": "pnpm --filter admin dev",
    "test": "pnpm -r --if-present test:unit"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 2: Generar el admin con el template blank**

Run (desde `infinitech/apps/`, crear la carpeta antes):
```bash
npx -y create-payload-app@3.90.2 -n admin -t blank --db postgres --db-connection-string postgres://pendiente --no-deps --no-agent
```
Expected: termina con "Launch Application" y crea `apps/admin/`.

- [ ] **Step 3: Limpiar lo que no usamos**

```bash
cd apps/admin
rm -rf .git "src/app/(frontend)" src/app/my-route tests/int tests/e2e tests/helpers docker-compose.yml playwright.config.ts test.env vitest.setup.ts .env
```
El admin no tiene frontend propio (la tienda es otra app) y sus tests son unitarios.

- [ ] **Step 4: Ajustar `apps/admin/package.json`**

Cambiar `next` y `eslint-config-next` a `16.4.0`, quitar de devDependencies `@playwright/test`, `@testing-library/react`, `@vitejs/plugin-react`, `jsdom`; agregar a dependencies `"@payloadcms/storage-s3": "3.90.2"` y `"isomorphic-dompurify": "^2.26.0"`. Reemplazar los scripts `dev`, `start`, `test`, `test:int`, `test:e2e` por:
```json
"dev": "cross-env NODE_OPTIONS=--no-deprecation next dev -p 3001",
"start": "cross-env NODE_OPTIONS=--no-deprecation next start -p ${PORT:-3001}",
"test:unit": "vitest run --config ./vitest.config.mts",
"seed": "cross-env NODE_OPTIONS=--no-deprecation payload run src/seed/index.ts"
```

- [ ] **Step 5: Vitest en entorno node**

`apps/admin/vitest.config.mts`:
```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
  },
})
```

`apps/admin/tests/unit/humo.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'

describe('entorno de pruebas', () => {
  it('corre', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Variables de entorno de ejemplo**

`apps/admin/.env.example`:
```bash
# Postgres (Railway, entorno development: usar la URL pública DATABASE_PUBLIC_URL)
DATABASE_URL=postgresql://usuario:clave@host:puerto/railway
# openssl rand -hex 32
PAYLOAD_SECRET=
# URL pública de este admin (para links y live preview)
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
# Tienda a la que se avisa al publicar (vacío = no avisar)
TIENDA_URL=http://localhost:3000
REVALIDATE_SECRET=
# Bucket S3 (solo producción; vacío = archivos en disco)
S3_BUCKET=
S3_ENDPOINT=
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Usuario admin que crea el seed
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

- [ ] **Step 7: Instalar y correr la prueba de humo**

Run (desde la raíz): `pnpm install && pnpm --filter admin test:unit`
Expected: `1 passed`.

- [ ] **Step 8: Base de datos de desarrollo (requiere confirmación del usuario)**

Preguntar al usuario antes de crear nada en Railway. Con su OK: crear el proyecto `infinitech` con un servicio Postgres (Railway MCP `create-project` y `deploy-template` de Postgres, o el dashboard). Copiar `DATABASE_PUBLIC_URL` a `apps/admin/.env` como `DATABASE_URL`, generar `PAYLOAD_SECRET` y `REVALIDATE_SECRET` con `openssl rand -hex 32`.

- [ ] **Step 9: Verificar que el admin levanta**

Run: `pnpm dev:admin`, abrir `http://localhost:3001/admin`.
Expected: pantalla "Create first user" de Payload, sin errores en consola. Detener el servidor.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: monorepo con el admin en Payload 3"
```
Verificar con `git status` que `apps/admin/.env` no quedó en el commit.

---

### Task 2: Slug y validaciones

**Files:**
- Create: `apps/admin/src/lib/slug.ts`, `apps/admin/src/lib/validaciones.ts`
- Test: `apps/admin/tests/unit/slug.spec.ts`, `apps/admin/tests/unit/validaciones.spec.ts`

**Interfaces:**
- Produces:
  - `slugify(texto: string): string`
  - `campoSlug(origen?: string): TextField` (campo `slug` único que se genera de `origen`, por defecto `'nombre'`)
  - `validarPrecio(valor: unknown): true | string`
  - `validarPrecioAnterior(valor: unknown, opciones: { siblingData: { precio?: unknown } }): true | string`
  - `validarColor(valor: unknown): true | string`
  - `validarTelefono(valor: unknown): true | string` (8 dígitos de El Salvador)
  - `validarWhatsapp(valor: unknown): true | string` (formato internacional, 11 a 15 dígitos)

- [ ] **Step 1: Tests que fallan**

`apps/admin/tests/unit/slug.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { slugify } from '@/lib/slug'

describe('slugify', () => {
  it('quita tildes y ñ, y usa guiones', () => {
    expect(slugify('Bocina Ñandú X200')).toBe('bocina-nandu-x200')
  })
  it('colapsa símbolos y espacios repetidos', () => {
    expect(slugify('  Cable USB-C  (1 m) ')).toBe('cable-usb-c-1-m')
  })
  it('da lo mismo para nombres que solo difieren en tildes', () => {
    expect(slugify('Bocina Nandu')).toBe(slugify('Bocina Ñandú'))
  })
})
```

`apps/admin/tests/unit/validaciones.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  validarColor,
  validarPrecio,
  validarPrecioAnterior,
  validarTelefono,
  validarWhatsapp,
} from '@/lib/validaciones'

describe('validarPrecio', () => {
  it('acepta centavos enteros positivos', () => {
    expect(validarPrecio(2499)).toBe(true)
  })
  it('rechaza dólares con decimales y muestra el ejemplo', () => {
    expect(validarPrecio(24.99)).toMatch(/2499/)
  })
  it('rechaza 0, negativos y vacío', () => {
    expect(validarPrecio(0)).not.toBe(true)
    expect(validarPrecio(-5)).not.toBe(true)
    expect(validarPrecio(undefined)).not.toBe(true)
  })
})

describe('validarPrecioAnterior', () => {
  it('es opcional', () => {
    expect(validarPrecioAnterior(undefined, { siblingData: { precio: 2499 } })).toBe(true)
    expect(validarPrecioAnterior(null, { siblingData: { precio: 2499 } })).toBe(true)
  })
  it('tiene que ser mayor que el precio', () => {
    expect(validarPrecioAnterior(2999, { siblingData: { precio: 2499 } })).toBe(true)
    expect(validarPrecioAnterior(2499, { siblingData: { precio: 2499 } })).toMatch(/mayor/)
  })
})

describe('validarColor', () => {
  it('acepta hex de 6 dígitos', () => {
    expect(validarColor('#7846d6')).toBe(true)
  })
  it('rechaza nombres y hex cortos', () => {
    expect(validarColor('morado')).not.toBe(true)
    expect(validarColor('#fff')).not.toBe(true)
  })
})

describe('validarTelefono', () => {
  it('acepta 8 dígitos con o sin guion', () => {
    expect(validarTelefono('7777-8888')).toBe(true)
    expect(validarTelefono('77778888')).toBe(true)
  })
  it('rechaza menos dígitos', () => {
    expect(validarTelefono('7777')).toMatch(/8 dígitos/)
  })
})

describe('validarWhatsapp', () => {
  it('acepta formato internacional sin +', () => {
    expect(validarWhatsapp('50377778888')).toBe(true)
  })
  it('rechaza el número sin código de país', () => {
    expect(validarWhatsapp('77778888')).toMatch(/503/)
  })
})
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm --filter admin test:unit`
Expected: FAIL, "Cannot find module '@/lib/slug'".

- [ ] **Step 3: Implementar**

`apps/admin/src/lib/slug.ts`:
```ts
import type { TextField } from 'payload'

export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function campoSlug(origen = 'nombre'): TextField {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description:
        'Se genera del nombre. Si lo cambiás, los links que ya se compartieron dejan de funcionar.',
    },
    hooks: {
      beforeValidate: [
        ({ value, siblingData }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          const fuente = siblingData?.[origen]
          return typeof fuente === 'string' ? slugify(fuente) : value
        },
      ],
    },
  }
}
```

`apps/admin/src/lib/validaciones.ts`:
```ts
const esEnteroPositivo = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0

export function validarPrecio(valor: unknown): true | string {
  if (esEnteroPositivo(valor)) return true
  if (typeof valor === 'number' && !Number.isInteger(valor)) {
    return `El precio va en centavos, sin punto. Para $${valor.toFixed(2)} escribí ${Math.round(valor * 100)}.`
  }
  return 'El precio va en centavos y tiene que ser mayor a 0. Ejemplo: 2499 para $24.99.'
}

export function validarPrecioAnterior(
  valor: unknown,
  { siblingData }: { siblingData: { precio?: unknown } },
): true | string {
  if (valor === undefined || valor === null) return true
  if (!esEnteroPositivo(valor)) return validarPrecio(valor)
  const precio = siblingData?.precio
  if (typeof precio === 'number' && valor > precio) return true
  return 'El precio anterior tiene que ser mayor que el precio actual para mostrarse como oferta. Dejalo vacío si no hay oferta.'
}

export function validarColor(valor: unknown): true | string {
  if (typeof valor === 'string' && /^#[0-9a-f]{6}$/i.test(valor)) return true
  return 'El color va en formato hex de 6 dígitos, por ejemplo #1a1a1a.'
}

export function validarTelefono(valor: unknown): true | string {
  const digitos = typeof valor === 'string' ? valor.replace(/\D/g, '') : ''
  if (/^[267]\d{7}$/.test(digitos)) return true
  return 'El teléfono tiene que tener 8 dígitos y empezar con 2, 6 o 7. Ejemplo: 7777-8888.'
}

export function validarWhatsapp(valor: unknown): true | string {
  if (typeof valor === 'string' && /^\d{11,15}$/.test(valor)) return true
  return 'Escribí el número con código de país y sin + ni espacios. Ejemplo para El Salvador: 50377778888.'
}
```

- [ ] **Step 4: Correr y ver que pasan**

Run: `pnpm --filter admin test:unit`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/lib apps/admin/tests/unit
git commit -m "feat(admin): slug y validaciones de precio, color y teléfono"
```

---

### Task 3: Roles, acceso y Usuarios

**Files:**
- Create: `apps/admin/src/access/index.ts`, `apps/admin/src/collections/Usuarios.ts`
- Delete: `apps/admin/src/collections/Users.ts`
- Modify: `apps/admin/src/payload.config.ts`
- Test: `apps/admin/tests/unit/acceso.spec.ts`

**Interfaces:**
- Produces:
  - `type Rol = 'admin' | 'editor' | 'servicio'`
  - `rolDe(user: unknown): Rol | undefined`
  - `esAdmin: Access`, `esEquipo: Access` (admin o editor), `publicadoOEquipo: Access` (equipo: `true`; resto: `{ _status: { equals: 'published' } }`), `creaPedidos: Access` (admin o servicio), `esAdminCampo: FieldAccess`
  - Colección `usuarios` (slug), auth con API key, campo `rol`.

- [ ] **Step 1: Test que falla**

`apps/admin/tests/unit/acceso.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { creaPedidos, esAdmin, esEquipo, publicadoOEquipo } from '@/access'

const con = (rol?: string) => ({ req: { user: rol ? { rol } : null } }) as never

describe('acceso', () => {
  it('esAdmin solo deja pasar al admin', () => {
    expect(esAdmin(con('admin'))).toBe(true)
    expect(esAdmin(con('editor'))).toBe(false)
    expect(esAdmin(con())).toBe(false)
  })
  it('esEquipo deja pasar a admin y editor, no a servicio', () => {
    expect(esEquipo(con('admin'))).toBe(true)
    expect(esEquipo(con('editor'))).toBe(true)
    expect(esEquipo(con('servicio'))).toBe(false)
  })
  it('el público solo ve publicados', () => {
    expect(publicadoOEquipo(con())).toEqual({ _status: { equals: 'published' } })
    expect(publicadoOEquipo(con('servicio'))).toEqual({ _status: { equals: 'published' } })
    expect(publicadoOEquipo(con('editor'))).toBe(true)
  })
  it('solo admin y servicio crean pedidos', () => {
    expect(creaPedidos(con('servicio'))).toBe(true)
    expect(creaPedidos(con('admin'))).toBe(true)
    expect(creaPedidos(con('editor'))).toBe(false)
    expect(creaPedidos(con())).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm --filter admin test:unit -- acceso`
Expected: FAIL, "Cannot find module '@/access'".

- [ ] **Step 3: Implementar el acceso**

`apps/admin/src/access/index.ts`:
```ts
import type { Access, FieldAccess } from 'payload'

export type Rol = 'admin' | 'editor' | 'servicio'

export const rolDe = (user: unknown): Rol | undefined =>
  (user as { rol?: Rol } | null | undefined)?.rol ?? undefined

const tiene =
  (...roles: Rol[]): Access =>
  ({ req }) =>
    roles.includes(rolDe(req.user) as Rol)

export const esAdmin = tiene('admin')
export const esEquipo = tiene('admin', 'editor')
export const creaPedidos = tiene('admin', 'servicio')

export const publicadoOEquipo: Access = (args) =>
  esEquipo(args) ? true : { _status: { equals: 'published' } }

export const esAdminCampo: FieldAccess = ({ req }) => rolDe(req.user) === 'admin'
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm --filter admin test:unit -- acceso`
Expected: PASS.

- [ ] **Step 5: Colección Usuarios**

`apps/admin/src/collections/Usuarios.ts`:
```ts
import type { CollectionConfig } from 'payload'
import type { Access } from 'payload'
import { esAdmin, esAdminCampo, rolDe } from '@/access'

// Admin ve a todos; los demás solo a sí mismos; sin sesión, nadie.
const propioOAdmin: Access = ({ req }) =>
  rolDe(req.user) === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: { useAsTitle: 'email', defaultColumns: ['nombre', 'email', 'rol'] },
  auth: {
    useAPIKey: true,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    read: propioOAdmin,
    create: esAdmin,
    update: propioOAdmin,
    delete: esAdmin,
    admin: ({ req }) => ['admin', 'editor'].includes(rolDe(req.user) ?? ''),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'usuarios', req })
          if (totalDocs === 0) data.rol = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'nombre', type: 'text', required: true },
    {
      name: 'rol',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      access: { update: esAdminCampo, create: esAdminCampo },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Servicio (tienda)', value: 'servicio' },
      ],
      admin: {
        description:
          'Admin: todo. Editor: catálogo, inicio y pedidos. Servicio: la tienda, solo crea pedidos con su API key.',
      },
    },
  ],
}
```
El primer usuario que se registra queda como admin aunque el campo diga editor; `access.admin` deja fuera del panel al usuario de servicio.

- [ ] **Step 6: Conectar en la config**

En `apps/admin/src/payload.config.ts` cambiar el import `Users` por `import { Usuarios } from './collections/Usuarios'`, `admin.user` por `Usuarios.slug` y `collections: [Usuarios, Media]`. Borrar `src/collections/Users.ts`. Cambiar `typescript.outputFile` a `path.resolve(dirname, '../../../packages/tipos/src/payload-types.ts')` y crear la carpeta `packages/tipos/src/`.

- [ ] **Step 7: Verificar en el panel**

Run: `pnpm dev:admin`. Crear el primer usuario en `/admin`.
Expected: el usuario creado muestra "Rol: Admin". Crear un segundo usuario con rol Editor desde la lista: se guarda como Editor.

- [ ] **Step 8: Commit**

```bash
git add apps/admin packages
git commit -m "feat(admin): roles admin, editor y servicio con acceso por rol"
```

---

### Task 4: Media con límites y SVG sanitizado

**Files:**
- Create: `apps/admin/src/lib/archivos.ts`, `apps/admin/src/lib/svg.ts`
- Modify: `apps/admin/src/collections/Media.ts`, `apps/admin/src/payload.config.ts`
- Test: `apps/admin/tests/unit/archivos.spec.ts`, `apps/admin/tests/unit/svg.spec.ts`

**Interfaces:**
- Produces:
  - `sanitizarSvg(svg: string): string`
  - `tipoDeArchivo(f: { mimetype: string; name: string }): 'imagen' | 'video' | 'modelo' | null`
  - `errorDeArchivo(f: { mimetype: string; name: string; size: number }): string | null`
  - `LIMITES_MB: { imagen: 10; video: 30; modelo: 15 }`
  - Colección `media` con `alt` obligatorio y tamaños `tarjeta` (600) y `galeria` (1200).

- [ ] **Step 1: Tests que fallan**

`apps/admin/tests/unit/svg.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { sanitizarSvg } from '@/lib/svg'

describe('sanitizarSvg', () => {
  it('quita scripts y manejadores de eventos', () => {
    const sucio =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><path d="M0 0h10v10z"/></svg>'
    const limpio = sanitizarSvg(sucio)
    expect(limpio).not.toMatch(/script/i)
    expect(limpio).not.toMatch(/onload/i)
    expect(limpio).toMatch(/<path/)
  })
  it('quita links javascript:', () => {
    const limpio = sanitizarSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>',
    )
    expect(limpio).not.toMatch(/javascript:/i)
  })
})
```

`apps/admin/tests/unit/archivos.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { errorDeArchivo, tipoDeArchivo } from '@/lib/archivos'

const MB = 1024 * 1024

describe('tipoDeArchivo', () => {
  it('reconoce imagen, video y modelo', () => {
    expect(tipoDeArchivo({ mimetype: 'image/webp', name: 'a.webp' })).toBe('imagen')
    expect(tipoDeArchivo({ mimetype: 'video/mp4', name: 'a.mp4' })).toBe('video')
    expect(tipoDeArchivo({ mimetype: 'model/gltf-binary', name: 'a.glb' })).toBe('modelo')
    expect(tipoDeArchivo({ mimetype: 'application/octet-stream', name: 'bocina.GLB' })).toBe('modelo')
  })
  it('no reconoce otros', () => {
    expect(tipoDeArchivo({ mimetype: 'application/pdf', name: 'a.pdf' })).toBeNull()
  })
})

describe('errorDeArchivo', () => {
  it('acepta dentro del límite', () => {
    expect(errorDeArchivo({ mimetype: 'video/mp4', name: 'a.mp4', size: 29 * MB })).toBeNull()
  })
  it('rechaza video de más de 30 MB con el tamaño y el límite', () => {
    expect(errorDeArchivo({ mimetype: 'video/mp4', name: 'a.mp4', size: 31 * MB })).toMatch(/31.*30 MB/)
  })
  it('rechaza modelo de más de 15 MB', () => {
    expect(errorDeArchivo({ mimetype: 'model/gltf-binary', name: 'a.glb', size: 16 * MB })).toMatch(/15 MB/)
  })
  it('rechaza tipos no permitidos y dice cuáles sí', () => {
    expect(errorDeArchivo({ mimetype: 'application/pdf', name: 'a.pdf', size: 1 })).toMatch(/\.glb/)
  })
})
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm --filter admin test:unit -- svg archivos`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar**

`apps/admin/src/lib/svg.ts`:
```ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizarSvg(svg: string): string {
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
}
```

`apps/admin/src/lib/archivos.ts`:
```ts
import { APIError, type CollectionBeforeOperationHook } from 'payload'
import { sanitizarSvg } from './svg'

export const LIMITES_MB = { imagen: 10, video: 30, modelo: 15 } as const
type Tipo = keyof typeof LIMITES_MB

export function tipoDeArchivo(f: { mimetype: string; name: string }): Tipo | null {
  if (f.mimetype.startsWith('image/')) return 'imagen'
  if (f.mimetype === 'video/mp4' || f.mimetype === 'video/webm') return 'video'
  if (f.mimetype === 'model/gltf-binary' || /\.glb$/i.test(f.name)) return 'modelo'
  return null
}

export function errorDeArchivo(f: { mimetype: string; name: string; size: number }): string | null {
  const tipo = tipoDeArchivo(f)
  if (!tipo) {
    return `"${f.name}" no es un tipo permitido. Subí una imagen (jpg, png, webp, avif, svg), un video (mp4, webm) o un modelo 3D (.glb).`
  }
  const mb = f.size / (1024 * 1024)
  if (mb > LIMITES_MB[tipo]) {
    return `"${f.name}" pesa ${mb.toFixed(0)} MB y el máximo para este tipo es ${LIMITES_MB[tipo]} MB. Comprimilo y volvé a subirlo.`
  }
  return null
}

export const revisarArchivo: CollectionBeforeOperationHook = ({ req, operation, args }) => {
  const file = req.file
  if (!file || (operation !== 'create' && operation !== 'update')) return args
  const error = errorDeArchivo({ mimetype: file.mimetype, name: file.name, size: file.size })
  if (error) throw new APIError(error, 400, undefined, true)
  if (file.mimetype === 'image/svg+xml') {
    const limpio = Buffer.from(sanitizarSvg(file.data.toString('utf8')))
    file.data = limpio
    file.size = limpio.length
  }
  return args
}
```

- [ ] **Step 4: Correr y ver que pasan**

Run: `pnpm --filter admin test:unit -- svg archivos`
Expected: PASS.

- [ ] **Step 5: Colección Media**

`apps/admin/src/collections/Media.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { esEquipo } from '@/access'
import { revisarArchivo } from '@/lib/archivos'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Archivo', plural: 'Archivos' },
  access: { read: () => true, create: esEquipo, update: esEquipo, delete: esEquipo },
  hooks: { beforeOperation: [revisarArchivo] },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'model/gltf-binary', 'application/octet-stream'],
    imageSizes: [
      { name: 'tarjeta', width: 600 },
      { name: 'galeria', width: 1200 },
    ],
    adminThumbnail: 'tarjeta',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Texto alternativo',
      admin: {
        description:
          'Describí lo que se ve, para lectores de pantalla y Google. Ejemplo: "Bocina negra con anillo de luz morado".',
      },
    },
  ],
}
```

- [ ] **Step 6: Almacenamiento S3 solo si hay bucket**

En `apps/admin/src/payload.config.ts` agregar `import { s3Storage } from '@payloadcms/storage-s3'` y en `plugins`:
```ts
s3Storage({
  enabled: Boolean(process.env.S3_BUCKET),
  collections: { media: true },
  bucket: process.env.S3_BUCKET || '',
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
}),
```

- [ ] **Step 7: Verificar en el panel**

Run: `pnpm --filter admin generate:importmap && pnpm dev:admin`.
1. Subir el SVG de prueba del Step 1 (guardarlo como `malo.svg`) con alt "prueba". Abrir la URL del archivo y ver el código fuente: no tiene `script` ni `onload`.
2. Subir un PDF. Expected: error con el texto "no es un tipo permitido".
3. Intentar guardar una imagen sin alt. Expected: el formulario marca "Texto alternativo" como obligatorio.

- [ ] **Step 8: Commit**

```bash
git add apps/admin
git commit -m "feat(admin): media con límites por tipo, alt obligatorio y SVG sanitizado"
```

---

### Task 5: Aviso de revalidación a la tienda

**Files:**
- Create: `apps/admin/src/lib/revalidar.ts`
- Test: `apps/admin/tests/unit/revalidar.spec.ts`

**Interfaces:**
- Produces:
  - `type Origen = 'productos' | 'categorias' | 'artes' | 'inicio' | 'ajustes'`
  - `tagsPara(origen: Origen, doc?: { slug?: string | null }): string[]`
  - `notificarTienda(tags: string[], env?: Record<string, string | undefined>, fetcher?: typeof fetch): Promise<boolean>`
  - `revalidarColeccion(origen: Origen): { afterChange: CollectionAfterChangeHook[]; afterDelete: CollectionAfterDeleteHook[] }`
  - `revalidarGlobal(origen: Origen): GlobalAfterChangeHook`
  - Contrato con la tienda: `POST {TIENDA_URL}/api/revalidate`, header `x-revalidate-secret: {REVALIDATE_SECRET}`, body `{ "tags": string[] }`. Tags: `productos`, `producto:{slug}`, `categorias`, `artes`, `inicio`, `ajustes`.

- [ ] **Step 1: Test que falla**

`apps/admin/tests/unit/revalidar.spec.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { notificarTienda, tagsPara } from '@/lib/revalidar'

describe('tagsPara', () => {
  it('producto: lista y su página', () => {
    expect(tagsPara('productos', { slug: 'bocina-x' })).toEqual(['productos', 'producto:bocina-x'])
  })
  it('categoría: también invalida productos', () => {
    expect(tagsPara('categorias')).toEqual(['categorias', 'productos'])
  })
  it('globals', () => {
    expect(tagsPara('inicio')).toEqual(['inicio'])
    expect(tagsPara('ajustes')).toEqual(['ajustes'])
  })
})

describe('notificarTienda', () => {
  const env = { TIENDA_URL: 'https://tienda.test', REVALIDATE_SECRET: 's3cr3t' }

  it('manda los tags con el secreto', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    await expect(notificarTienda(['inicio'], env, fetcher)).resolves.toBe(true)
    expect(fetcher).toHaveBeenCalledWith('https://tienda.test/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': 's3cr3t' },
      body: JSON.stringify({ tags: ['inicio'] }),
    })
  })
  it('no hace nada sin TIENDA_URL', async () => {
    const fetcher = vi.fn()
    await expect(notificarTienda(['inicio'], {}, fetcher)).resolves.toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('si la tienda está caída, no lanza error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(notificarTienda(['inicio'], env, fetcher)).resolves.toBe(false)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm --filter admin test:unit -- revalidar`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`apps/admin/src/lib/revalidar.ts`:
```ts
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

export type Origen = 'productos' | 'categorias' | 'artes' | 'inicio' | 'ajustes'

export function tagsPara(origen: Origen, doc: { slug?: string | null } = {}): string[] {
  switch (origen) {
    case 'productos':
      return ['productos', ...(doc.slug ? [`producto:${doc.slug}`] : [])]
    case 'categorias':
      return ['categorias', 'productos']
    default:
      return [origen]
  }
}

export async function notificarTienda(
  tags: string[],
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!tags.length || !env.TIENDA_URL || !env.REVALIDATE_SECRET) return false
  try {
    const res = await fetcher(`${env.TIENDA_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags }),
    })
    if (!res.ok) console.warn(`[revalidar] la tienda respondió ${res.status} para ${tags.join(', ')}`)
    return res.ok
  } catch (err) {
    console.warn(`[revalidar] no se pudo avisar a la tienda: ${(err as Error).message}`)
    return false
  }
}

const esBorrador = (doc: unknown) => (doc as { _status?: string } | null)?._status === 'draft'

export function revalidarColeccion(origen: Origen): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  return {
    afterChange: [
      ({ doc, previousDoc }) => {
        if (esBorrador(doc) && !previousDoc?._status) return doc
        const tags = new Set([...tagsPara(origen, doc), ...tagsPara(origen, previousDoc ?? {})])
        void notificarTienda([...tags])
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        void notificarTienda(tagsPara(origen, doc))
        return doc
      },
    ],
  }
}

export function revalidarGlobal(origen: Origen): GlobalAfterChangeHook {
  return ({ doc }) => {
    if (!esBorrador(doc)) void notificarTienda(tagsPara(origen))
    return doc
  }
}
```
Un producto que pasa de publicado a borrador también avisa (lo quita de la tienda); un borrador nuevo que nunca se publicó no avisa.

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm --filter admin test:unit -- revalidar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/lib/revalidar.ts apps/admin/tests/unit/revalidar.spec.ts
git commit -m "feat(admin): avisar a la tienda qué regenerar al publicar"
```

---

### Task 6: Categorías, Productos y Artes

**Files:**
- Create: `apps/admin/src/collections/Categorias.ts`, `apps/admin/src/collections/Productos.ts`, `apps/admin/src/collections/Artes.ts`
- Modify: `apps/admin/src/payload.config.ts`

**Interfaces:**
- Consumes: `campoSlug` (Task 2), validadores (Task 2), `esEquipo`, `publicadoOEquipo`, `rolDe` (Task 3), `revalidarColeccion` (Task 5), colección `media` (Task 4).
- Produces: colecciones `categorias`, `productos` (con drafts), `artes`. Campos exactos según la sección 3 del spec; `disponibilidad` con valores `disponible | agotado | por-encargo`.

- [ ] **Step 1: Categorías**

`apps/admin/src/collections/Categorias.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { esEquipo } from '@/access'
import { campoSlug } from '@/lib/slug'
import { revalidarColeccion } from '@/lib/revalidar'

export const Categorias: CollectionConfig = {
  slug: 'categorias',
  labels: { singular: 'Categoría', plural: 'Categorías' },
  defaultSort: 'orden',
  admin: { useAsTitle: 'nombre', defaultColumns: ['nombre', 'orden'] },
  access: { read: () => true, create: esEquipo, update: esEquipo, delete: esEquipo },
  hooks: revalidarColeccion('categorias'),
  fields: [
    { name: 'nombre', type: 'text', required: true },
    campoSlug(),
    {
      name: 'icono',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'SVG de un solo color, con trazo. Se muestra en la barra de categorías.' },
    },
    { name: 'orden', type: 'number', defaultValue: 0, admin: { description: 'Menor primero.' } },
  ],
}
```

- [ ] **Step 2: Productos**

`apps/admin/src/collections/Productos.ts`:
```ts
import type { CollectionConfig, Field } from 'payload'
import { esEquipo, publicadoOEquipo } from '@/access'
import { campoSlug } from '@/lib/slug'
import { revalidarColeccion } from '@/lib/revalidar'
import { validarColor, validarPrecio, validarPrecioAnterior } from '@/lib/validaciones'

export const DISPONIBILIDAD = [
  { label: 'Disponible', value: 'disponible' },
  { label: 'Agotado', value: 'agotado' },
  { label: 'Por encargo', value: 'por-encargo' },
]

const disponibilidad = (descripcion: string): Field => ({
  name: 'disponibilidad',
  type: 'select',
  required: true,
  defaultValue: 'disponible',
  options: DISPONIBILIDAD,
  admin: { description: descripcion },
})

export const Productos: CollectionConfig = {
  slug: 'productos',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'categoria', 'precio', 'disponibilidad', '_status'],
  },
  versions: { drafts: true },
  access: { read: publicadoOEquipo, create: esEquipo, update: esEquipo, delete: esEquipo },
  hooks: revalidarColeccion('productos'),
  fields: [
    { name: 'nombre', type: 'text', required: true },
    campoSlug(),
    { name: 'categoria', type: 'relationship', relationTo: 'categorias', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'precio',
          type: 'number',
          required: true,
          validate: validarPrecio,
          admin: { description: 'En centavos: 2499 = $24.99.' },
        },
        {
          name: 'precioAnterior',
          type: 'number',
          validate: validarPrecioAnterior,
          admin: { description: 'Opcional. Si lo llenás, la tienda muestra la oferta tachada.' },
        },
      ],
    },
    {
      name: 'resumen',
      type: 'text',
      required: true,
      maxLength: 120,
      admin: { description: 'Lo que se lee en la tarjeta del catálogo. Máximo 120 caracteres.' },
    },
    { name: 'descripcion', type: 'richText' },
    {
      name: 'fotos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'La primera es la principal.' },
    },
    {
      name: 'especificaciones',
      type: 'array',
      labels: { singular: 'Especificación', plural: 'Especificaciones' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'clave', type: 'text', required: true, admin: { placeholder: 'Batería' } },
            { name: 'valor', type: 'text', required: true, admin: { placeholder: '12 h' } },
          ],
        },
      ],
    },
    {
      name: 'variantes',
      type: 'array',
      labels: { singular: 'Variante', plural: 'Variantes' },
      admin: { description: 'Colores u opciones del mismo producto. Todas tienen el precio del producto.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nombre', type: 'text', required: true, admin: { placeholder: 'Negro' } },
            { name: 'color', type: 'text', required: true, validate: validarColor, admin: { placeholder: '#1a1a1a' } },
          ],
        },
        { name: 'fotos', type: 'upload', relationTo: 'media', hasMany: true },
        disponibilidad('De esta variante.'),
      ],
    },
    {
      ...disponibilidad('Se usa si el producto no tiene variantes.'),
      admin: { position: 'sidebar', description: 'Se usa si el producto no tiene variantes.' },
    } as Field,
    {
      name: 'tiempoEncargo',
      type: 'text',
      admin: {
        position: 'sidebar',
        placeholder: '5 a 7 días',
        condition: (_, siblingData) => siblingData?.disponibilidad === 'por-encargo',
      },
    },
    { name: 'destacado', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
```

- [ ] **Step 3: Artes**

`apps/admin/src/collections/Artes.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { esEquipo } from '@/access'
import { revalidarColeccion } from '@/lib/revalidar'

export const Artes: CollectionConfig = {
  slug: 'artes',
  labels: { singular: 'Arte', plural: 'Artes ("Lo nuevo")' },
  defaultSort: 'orden',
  admin: { useAsTitle: 'titulo', defaultColumns: ['titulo', 'etiqueta', 'activa', 'orden'] },
  access: {
    read: (args) => (esEquipo(args) ? true : { activa: { equals: true } }),
    create: esEquipo,
    update: esEquipo,
    delete: esEquipo,
  },
  hooks: revalidarColeccion('artes'),
  fields: [
    {
      name: 'imagen',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Vertical, 1080×1350.' },
    },
    {
      name: 'etiqueta',
      type: 'select',
      required: true,
      defaultValue: 'nuevo',
      options: [
        { label: 'Nuevo', value: 'nuevo' },
        { label: 'Promoción', value: 'promocion' },
      ],
    },
    { name: 'titulo', type: 'text', required: true },
    { name: 'producto', type: 'relationship', relationTo: 'productos', admin: { description: 'Opcional: a dónde lleva el arte.' } },
    { name: 'orden', type: 'number', defaultValue: 0 },
    { name: 'activa', type: 'checkbox', defaultValue: true },
  ],
}
```

- [ ] **Step 4: Registrar y regenerar**

En `payload.config.ts`: `collections: [Usuarios, Media, Categorias, Productos, Artes]` con sus imports. Run: `pnpm --filter admin generate:types && pnpm --filter admin generate:importmap && pnpm --filter admin test:unit`
Expected: `packages/tipos/src/payload-types.ts` contiene `interface Producto` con `precio: number` y `variantes?:`; tests en verde.

- [ ] **Step 5: Verificar en el panel**

Run: `pnpm dev:admin`.
1. Crear la categoría "Bocinas" con un ícono SVG.
2. Crear un producto con precio `24.99`. Expected: error "Para $24.99 escribí 2499".
3. Corregir a `2499`, sin fotos, y publicar. Expected: error de fotos obligatorias.
4. Agregar foto y publicar. Expected: se publica; `GET http://localhost:3001/api/productos` sin sesión (ventana privada) lo devuelve.
5. Guardar otro producto como borrador. Expected: no aparece en `GET /api/productos` sin sesión.

- [ ] **Step 6: Commit**

```bash
git add apps/admin packages/tipos
git commit -m "feat(admin): categorías, productos con variantes y artes"
```

---

### Task 7: Pedidos con precios fijados en el servidor

**Files:**
- Create: `apps/admin/src/lib/pedidos.ts`, `apps/admin/src/collections/Pedidos.ts`
- Modify: `apps/admin/src/payload.config.ts`
- Test: `apps/admin/tests/unit/pedidos.spec.ts`

**Interfaces:**
- Consumes: `creaPedidos`, `esEquipo`, `esAdmin` (Task 3), `validarTelefono` (Task 2), colección `productos` (Task 6).
- Produces:
  - `formatearNumero(id: number): string` → `INF-000123`
  - `type ProductoParaPedido = { id: number; nombre: string; precio: number; disponibilidad: string; variantes?: { nombre: string; disponibilidad: string }[] | null }`
  - `type LineaEntrada = { producto: number; variante?: string | null; cantidad: number }`
  - `armarLineas(entrada: LineaEntrada[], productos: Map<number, ProductoParaPedido>): { lineas: { producto: number; variante: string | null; cantidad: number; precioUnitario: number }[]; total: number }` (lanza `Error` con mensaje para el cliente)
  - `CANTIDAD_MAXIMA = 20`, `LINEAS_MAXIMAS = 30`
  - Colección `pedidos`. Contrato para la tienda (Plan 2): `POST /api/pedidos` con `Authorization: usuarios API-Key {key}` y body `{ cliente: { nombre, telefono, zona, direccion?, nota? }, lineas: LineaEntrada[], canal: 'whatsapp' }`. Responde el doc con `id`, `numero`, `lineas` con `precioUnitario` y `total`. Cualquier `precioUnitario` o `total` que mande el cliente se ignora.

- [ ] **Step 1: Test que falla**

`apps/admin/tests/unit/pedidos.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { armarLineas, formatearNumero, type ProductoParaPedido } from '@/lib/pedidos'

const productos = new Map<number, ProductoParaPedido>([
  [1, { id: 1, nombre: 'Bocina X', precio: 2499, disponibilidad: 'disponible', variantes: [
    { nombre: 'Negro', disponibilidad: 'disponible' },
    { nombre: 'Azul', disponibilidad: 'agotado' },
  ] }],
  [2, { id: 2, nombre: 'Cable', precio: 599, disponibilidad: 'disponible', variantes: [] }],
  [3, { id: 3, nombre: 'Power bank', precio: 1999, disponibilidad: 'agotado', variantes: [] }],
])

describe('formatearNumero', () => {
  it('rellena con ceros', () => {
    expect(formatearNumero(123)).toBe('INF-000123')
  })
})

describe('armarLineas', () => {
  it('usa los precios de la base y suma en centavos', () => {
    const r = armarLineas(
      [
        { producto: 1, variante: 'Negro', cantidad: 2 },
        { producto: 2, cantidad: 3 },
      ],
      productos,
    )
    expect(r.lineas[0]).toEqual({ producto: 1, variante: 'Negro', cantidad: 2, precioUnitario: 2499 })
    expect(r.total).toBe(2499 * 2 + 599 * 3)
  })
  it('ignora el precio que manda el cliente', () => {
    const r = armarLineas([{ producto: 2, cantidad: 1, precioUnitario: 1 } as never], productos)
    expect(r.total).toBe(599)
  })
  it('rechaza producto que no existe o no está publicado', () => {
    expect(() => armarLineas([{ producto: 99, cantidad: 1 }], productos)).toThrow(/ya no está disponible/)
  })
  it('rechaza producto agotado', () => {
    expect(() => armarLineas([{ producto: 3, cantidad: 1 }], productos)).toThrow(/Power bank.*agotado/)
  })
  it('rechaza variante inexistente o agotada', () => {
    expect(() => armarLineas([{ producto: 1, variante: 'Rojo', cantidad: 1 }], productos)).toThrow(/Rojo/)
    expect(() => armarLineas([{ producto: 1, variante: 'Azul', cantidad: 1 }], productos)).toThrow(/Azul.*agotad/)
  })
  it('exige variante si el producto tiene variantes', () => {
    expect(() => armarLineas([{ producto: 1, cantidad: 1 }], productos)).toThrow(/Elegí/)
  })
  it('rechaza cantidades fuera de rango y carritos vacíos', () => {
    expect(() => armarLineas([{ producto: 2, cantidad: 0 }], productos)).toThrow(/entre 1 y 20/)
    expect(() => armarLineas([{ producto: 2, cantidad: 21 }], productos)).toThrow(/entre 1 y 20/)
    expect(() => armarLineas([{ producto: 2, cantidad: 1.5 }], productos)).toThrow(/entre 1 y 20/)
    expect(() => armarLineas([], productos)).toThrow(/vacío/)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm --filter admin test:unit -- pedidos`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar la lógica**

`apps/admin/src/lib/pedidos.ts`:
```ts
export const CANTIDAD_MAXIMA = 20
export const LINEAS_MAXIMAS = 30

export type ProductoParaPedido = {
  id: number
  nombre: string
  precio: number
  disponibilidad: string
  variantes?: { nombre: string; disponibilidad: string }[] | null
}
export type LineaEntrada = { producto: number; variante?: string | null; cantidad: number }

export const formatearNumero = (id: number) => `INF-${String(id).padStart(6, '0')}`

export function armarLineas(entrada: LineaEntrada[], productos: Map<number, ProductoParaPedido>) {
  if (!entrada.length) throw new Error('El carrito está vacío. Agregá al menos un producto.')
  if (entrada.length > LINEAS_MAXIMAS) throw new Error(`Un pedido puede tener hasta ${LINEAS_MAXIMAS} productos distintos.`)

  const lineas = entrada.map(({ producto, variante, cantidad }) => {
    const p = productos.get(producto)
    if (!p) throw new Error('Uno de los productos ya no está disponible. Actualizá la página y revisá tu carrito.')
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      throw new Error(`La cantidad de "${p.nombre}" tiene que ser entre 1 y ${CANTIDAD_MAXIMA}.`)
    }
    const variantes = p.variantes ?? []
    if (variantes.length) {
      if (!variante) throw new Error(`Elegí una opción de "${p.nombre}" antes de pedir.`)
      const v = variantes.find((x) => x.nombre === variante)
      if (!v) throw new Error(`"${p.nombre}" no tiene la opción "${variante}". Elegí otra.`)
      if (v.disponibilidad === 'agotado') throw new Error(`"${p.nombre}" en ${variante} está agotado. Elegí otra opción.`)
    } else if (p.disponibilidad === 'agotado') {
      throw new Error(`"${p.nombre}" está agotado. Quitalo del carrito para seguir.`)
    }
    return { producto, variante: variantes.length ? variante! : null, cantidad, precioUnitario: p.precio }
  })

  const total = lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0)
  return { lineas, total }
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm --filter admin test:unit -- pedidos`
Expected: PASS.

- [ ] **Step 5: Colección Pedidos**

`apps/admin/src/collections/Pedidos.ts`:
```ts
import { APIError, type CollectionConfig } from 'payload'
import { creaPedidos, esAdmin, esEquipo } from '@/access'
import { armarLineas, formatearNumero, type LineaEntrada, type ProductoParaPedido } from '@/lib/pedidos'
import { validarTelefono } from '@/lib/validaciones'

export const Pedidos: CollectionConfig = {
  slug: 'pedidos',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: { defaultColumns: ['numero', 'estado', 'total', 'canal', 'createdAt'] },
  defaultSort: '-createdAt',
  access: { read: esEquipo, create: creaPedidos, update: esEquipo, delete: esAdmin },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const entrada = (data.lineas ?? []) as LineaEntrada[]
        const ids = [...new Set(entrada.map((l) => Number(l.producto)))]
        const { docs } = await req.payload.find({
          collection: 'productos',
          where: { id: { in: ids }, _status: { equals: 'published' } },
          limit: ids.length || 1,
          depth: 0,
          overrideAccess: true,
          req,
        })
        const mapa = new Map<number, ProductoParaPedido>(docs.map((d) => [d.id as number, d as unknown as ProductoParaPedido]))
        try {
          const { lineas, total } = armarLineas(
            entrada.map((l) => ({ producto: Number(l.producto), variante: l.variante, cantidad: Number(l.cantidad) })),
            mapa,
          )
          return { ...data, lineas, total, estado: 'pendiente' }
        } catch (err) {
          throw new APIError((err as Error).message, 400, undefined, true)
        }
      },
    ],
  },
  fields: [
    {
      name: 'numero',
      type: 'text',
      virtual: true,
      admin: { readOnly: true },
      hooks: { afterRead: [({ siblingData }) => (siblingData?.id ? formatearNumero(siblingData.id) : undefined)] },
    },
    {
      name: 'cliente',
      type: 'group',
      fields: [
        { name: 'nombre', type: 'text', required: true, maxLength: 80 },
        { name: 'telefono', type: 'text', required: true, validate: validarTelefono },
        { name: 'zona', type: 'text', required: true, maxLength: 80 },
        { name: 'direccion', type: 'text', maxLength: 200 },
        { name: 'nota', type: 'textarea', maxLength: 500 },
      ],
    },
    {
      name: 'lineas',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { readOnly: true },
      fields: [
        { name: 'producto', type: 'relationship', relationTo: 'productos', required: true },
        { name: 'variante', type: 'text' },
        { name: 'cantidad', type: 'number', required: true },
        { name: 'precioUnitario', type: 'number', admin: { description: 'Centavos, tomado de la base al crear el pedido.' } },
      ],
    },
    { name: 'total', type: 'number', admin: { readOnly: true, description: 'Centavos.' } },
    {
      name: 'canal',
      type: 'select',
      required: true,
      defaultValue: 'whatsapp',
      options: [
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Wompi', value: 'wompi' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'estado',
      type: 'select',
      required: true,
      defaultValue: 'pendiente',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Confirmado', value: 'confirmado' },
        { label: 'Enviado', value: 'enviado' },
        { label: 'Entregado', value: 'entregado' },
        { label: 'Cancelado', value: 'cancelado' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
```

- [ ] **Step 6: Registrar, regenerar y probar contra la API**

Agregar `Pedidos` a `collections` en `payload.config.ts`. Run: `pnpm --filter admin generate:types && pnpm --filter admin generate:importmap && pnpm dev:admin`.
En el panel crear un usuario con rol Servicio, activar "Enable API Key" y copiar la key. Con el producto publicado de la Task 6 (id 1):
```bash
curl -s -X POST http://localhost:3001/api/pedidos \
  -H "Authorization: usuarios API-Key $KEY" -H "content-type: application/json" \
  -d '{"cliente":{"nombre":"Ana","telefono":"7777-8888","zona":"San Salvador"},"lineas":[{"producto":1,"cantidad":2,"precioUnitario":1}],"canal":"whatsapp","total":1}'
```
Expected: respuesta con `"numero":"INF-000001"`, `precioUnitario` igual al precio real y `total` = precio × 2.
Repetir con `"producto":999`. Expected: HTTP 400 con "ya no está disponible".
Repetir sin el header Authorization. Expected: HTTP 403.

- [ ] **Step 7: Commit**

```bash
git add apps/admin packages/tipos
git commit -m "feat(admin): pedidos con precios y total fijados en el servidor"
```

---

### Task 8: Globals Ajustes e Inicio

**Files:**
- Create: `apps/admin/src/globals/Ajustes.ts`, `apps/admin/src/globals/Inicio.ts`, `apps/admin/src/globals/bloques.ts`
- Modify: `apps/admin/src/payload.config.ts`

**Interfaces:**
- Consumes: `esAdmin`, `esEquipo` (Task 3), `validarWhatsapp` (Task 2), `revalidarGlobal` (Task 5), colecciones `media` y `categorias`.
- Produces: global `ajustes` con `whatsapp`, `plantillaMensaje`, `redes[]`, `aviso`, `mantenimiento`, `mensajeMantenimiento`; global `inicio` (drafts) con `secciones` de bloques `heroVideo | hero3D | historiaBocina | loNuevo | catalogo | cierre`. Variables de la plantilla: `{numero} {lineas} {total} {nombre} {telefono} {zona} {direccion} {nota}`.

- [ ] **Step 1: Bloques**

`apps/admin/src/globals/bloques.ts`:
```ts
import type { Block } from 'payload'

const titulo = { name: 'titulo', type: 'text', required: true } as const
const subtitulo = { name: 'subtitulo', type: 'text' } as const
const respaldo = {
  name: 'respaldo',
  type: 'upload',
  relationTo: 'media',
  required: true,
  admin: { description: 'Imagen que se ve mientras carga o si el video/modelo falla.' },
} as const

export const heroVideo: Block = {
  slug: 'heroVideo',
  labels: { singular: 'Hero con video', plural: 'Heros con video' },
  fields: [
    titulo,
    subtitulo,
    { name: 'video', type: 'upload', relationTo: 'media', required: true, admin: { description: 'mp4 o webm, corto, sin audio, hasta 30 MB.' } },
    respaldo,
  ],
}

export const hero3D: Block = {
  slug: 'hero3D',
  labels: { singular: 'Hero 3D', plural: 'Heros 3D' },
  fields: [
    titulo,
    subtitulo,
    { name: 'modelo', type: 'upload', relationTo: 'media', required: true, admin: { description: 'Archivo .glb, hasta 15 MB. El cliente lo puede girar en todas direcciones.' } },
    { name: 'giroAutomatico', type: 'checkbox', defaultValue: true },
    respaldo,
  ],
}

export const historiaBocina: Block = {
  slug: 'historiaBocina',
  labels: { singular: 'Historia de la bocina', plural: 'Historias de la bocina' },
  fields: [
    {
      name: 'pasos',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      required: true,
      admin: { description: 'Exactamente 4 pasos, uno por etapa de la animación.' },
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'texto', type: 'textarea', required: true },
        { name: 'formula', type: 'text', admin: { placeholder: 'V = π ∫ f(y)² dy' } },
      ],
    },
  ],
}

export const loNuevo: Block = {
  slug: 'loNuevo',
  labels: { singular: 'Lo nuevo', plural: 'Lo nuevo' },
  fields: [{ ...titulo, defaultValue: 'Lo nuevo.' }, { name: 'bajada', type: 'text', defaultValue: 'Mira lo que llegó a Infinitech.' }],
}

export const catalogo: Block = {
  slug: 'catalogo',
  labels: { singular: 'Catálogo', plural: 'Catálogos' },
  fields: [
    { ...titulo, defaultValue: 'Productos' },
    { name: 'categorias', type: 'relationship', relationTo: 'categorias', hasMany: true, admin: { description: 'Vacío = todas.' } },
    { name: 'destacadosPrimero', type: 'checkbox', defaultValue: true },
  ],
}

export const cierre: Block = {
  slug: 'cierre',
  labels: { singular: 'Cierre', plural: 'Cierres' },
  fields: [
    titulo,
    { name: 'texto', type: 'text' },
    {
      name: 'boton',
      type: 'group',
      fields: [
        { name: 'texto', type: 'text', required: true, defaultValue: 'Ver productos' },
        { name: 'destino', type: 'text', required: true, defaultValue: '#productos', admin: { description: 'Ruta o ancla, por ejemplo /c/bocinas o #productos.' } },
      ],
    },
  ],
}

export const BLOQUES = [heroVideo, hero3D, historiaBocina, loNuevo, catalogo, cierre]
```

- [ ] **Step 2: Inicio**

`apps/admin/src/globals/Inicio.ts`:
```ts
import type { GlobalConfig } from 'payload'
import { esEquipo } from '@/access'
import { revalidarGlobal } from '@/lib/revalidar'
import { BLOQUES } from './bloques'

export const Inicio: GlobalConfig = {
  slug: 'inicio',
  label: 'Página de inicio',
  versions: { drafts: true },
  access: { read: () => true, update: esEquipo },
  admin: {
    livePreview: {
      url: () => `${process.env.TIENDA_URL ?? 'http://localhost:3000'}/?vista-previa=1`,
      breakpoints: [
        { label: 'Celular', name: 'celular', width: 390, height: 844 },
        { label: 'Escritorio', name: 'escritorio', width: 1440, height: 900 },
      ],
    },
  },
  hooks: { afterChange: [revalidarGlobal('inicio')] },
  fields: [
    {
      name: 'secciones',
      type: 'blocks',
      blocks: BLOQUES,
      admin: { description: 'Arrastrá para reordenar. La tienda muestra los bloques en este orden debajo de la barra de categorías.' },
    },
  ],
}
```

- [ ] **Step 3: Ajustes**

`apps/admin/src/globals/Ajustes.ts`:
```ts
import type { GlobalConfig } from 'payload'
import { esAdmin } from '@/access'
import { revalidarGlobal } from '@/lib/revalidar'
import { validarWhatsapp } from '@/lib/validaciones'

export const PLANTILLA_PEDIDO = `Hola, quiero hacer este pedido:

Pedido {numero}
{lineas}

Total: {total}

Nombre: {nombre}
Teléfono: {telefono}
Zona: {zona}
Dirección: {direccion}
Nota: {nota}`

export const Ajustes: GlobalConfig = {
  slug: 'ajustes',
  label: 'Ajustes de la tienda',
  access: { read: () => true, update: esAdmin },
  hooks: { afterChange: [revalidarGlobal('ajustes')] },
  fields: [
    { name: 'whatsapp', type: 'text', required: true, validate: validarWhatsapp, admin: { placeholder: '50377778888' } },
    {
      name: 'plantillaMensaje',
      type: 'textarea',
      required: true,
      defaultValue: PLANTILLA_PEDIDO,
      admin: { description: 'Variables: {numero} {lineas} {total} {nombre} {telefono} {zona} {direccion} {nota}.' },
    },
    {
      name: 'redes',
      type: 'array',
      fields: [
        {
          name: 'red',
          type: 'select',
          required: true,
          options: ['instagram', 'facebook', 'tiktok', 'youtube'].map((v) => ({ label: v, value: v })),
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'aviso', type: 'text', admin: { description: 'Opcional. Barra fina arriba de la tienda, por ejemplo "Envíos gratis en San Salvador".' } },
    { name: 'mantenimiento', type: 'checkbox', defaultValue: false, admin: { description: 'Muestra la página de mantenimiento en toda la tienda.' } },
    {
      name: 'mensajeMantenimiento',
      type: 'textarea',
      defaultValue: 'Estamos actualizando la tienda. Volvemos en un rato.',
      admin: { condition: (data) => Boolean(data?.mantenimiento) },
    },
  ],
}
```

- [ ] **Step 4: Registrar y verificar**

En `payload.config.ts` agregar `globals: [Inicio, Ajustes]` con sus imports. Run: `pnpm --filter admin generate:types && pnpm --filter admin generate:importmap && pnpm --filter admin test:unit && pnpm dev:admin`.
1. En "Página de inicio" agregar un bloque "Hero con video" y uno "Catálogo", reordenarlos arrastrando y guardar como borrador. Expected: `GET /api/globals/inicio` sin sesión devuelve `secciones` vacío (aún no publicado).
2. Publicar. Expected: `GET /api/globals/inicio` devuelve los dos bloques en el orden elegido con `blockType`.
3. En Ajustes poner WhatsApp `77778888`. Expected: error que pide el 503.
4. Entrar con un usuario Editor. Expected: Ajustes se ve pero no deja guardar.

- [ ] **Step 5: Commit**

```bash
git add apps/admin packages/tipos
git commit -m "feat(admin): página de inicio por bloques y ajustes de la tienda"
```

---

### Task 9: Datos de ejemplo (seed)

**Files:**
- Create: `apps/admin/src/seed/datos.ts`, `apps/admin/src/seed/index.ts`

**Interfaces:**
- Consumes: todas las colecciones y globals; `PLANTILLA_PEDIDO` (Task 8).
- Produces: `pnpm --filter admin seed` deja 6 categorías con ícono, 8 productos publicados (2 con variantes), 3 artes, inicio con los 5 bloques del spec, ajustes con WhatsApp de ejemplo, el usuario admin de `SEED_ADMIN_EMAIL` y un usuario `servicio` con API key (la imprime una sola vez). Si ya hay categorías, no hace nada.

- [ ] **Step 1: Datos**

`apps/admin/src/seed/datos.ts`:
```ts
const svg = (cuerpo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`

export const CATEGORIAS = [
  { nombre: 'Bocinas', orden: 1, icono: svg('<rect x="18" y="6" width="28" height="52" rx="8"/><circle cx="32" cy="38" r="9"/><circle cx="32" cy="18" r="4"/>') },
  { nombre: 'Barras', orden: 2, icono: svg('<rect x="4" y="24" width="56" height="16" rx="6"/><path d="M14 32h4M24 32h4M36 32h4M46 32h4"/>') },
  { nombre: 'Audífonos', orden: 3, icono: svg('<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect x="8" y="36" width="10" height="18" rx="4"/><rect x="46" y="36" width="10" height="18" rx="4"/>') },
  { nombre: 'Cargadores', orden: 4, icono: svg('<rect x="18" y="20" width="28" height="30" rx="6"/><path d="M26 20v-10M38 20v-10M32 50v8"/><path d="M33 28l-5 8h8l-5 8"/>') },
  { nombre: 'Power banks', orden: 5, icono: svg('<rect x="16" y="8" width="32" height="48" rx="8"/><path d="M26 18h12M24 46h4M30 46h4M36 46h4"/>') },
  { nombre: 'Cables', orden: 6, icono: svg('<path d="M14 10v12a6 6 0 0 0 6 6h24a6 6 0 0 1 6 6v20"/><rect x="10" y="4" width="8" height="8" rx="2"/><rect x="46" y="52" width="8" height="8" rx="2"/>') },
]

type Variante = { nombre: string; color: string; disponibilidad: 'disponible' | 'agotado' }
export const PRODUCTOS: {
  nombre: string
  categoria: string
  precio: number
  precioAnterior?: number
  resumen: string
  destacado?: boolean
  variantes?: Variante[]
  especificaciones?: { clave: string; valor: string }[]
}[] = [
  { nombre: 'Bocina Bluetooth portátil', categoria: 'Bocinas', precio: 2999, precioAnterior: 3499, resumen: '[Ejemplo] Batería de 12 h, resistente al agua.', destacado: true,
    variantes: [{ nombre: 'Negro', color: '#1a1a1a', disponibilidad: 'disponible' }, { nombre: 'Morado', color: '#7846d6', disponibilidad: 'agotado' }],
    especificaciones: [{ clave: 'Batería', valor: '12 h' }, { clave: 'Conexión', valor: 'Bluetooth 5.3' }] },
  { nombre: 'Barra de sonido', categoria: 'Barras', precio: 7999, resumen: '[Ejemplo] 120 W con subwoofer.' },
  { nombre: 'Audífonos inalámbricos', categoria: 'Audífonos', precio: 3999, resumen: '[Ejemplo] Cancelación de ruido, 30 h.', destacado: true,
    variantes: [{ nombre: 'Blanco', color: '#f8f7f9', disponibilidad: 'disponible' }, { nombre: 'Negro', color: '#1a1a1a', disponibilidad: 'disponible' }] },
  { nombre: 'Cargador de carga rápida', categoria: 'Cargadores', precio: 1499, resumen: '[Ejemplo] 30 W, USB-C y USB-A.' },
  { nombre: 'Power bank', categoria: 'Power banks', precio: 2499, resumen: '[Ejemplo] 20 000 mAh, dos puertos.' },
  { nombre: 'Cable USB-C reforzado', categoria: 'Cables', precio: 599, resumen: '[Ejemplo] 1 m, nylon trenzado.' },
  { nombre: 'Bocina para fiestas', categoria: 'Bocinas', precio: 9999, resumen: '[Ejemplo] Luces, micrófono y 60 W.' },
  { nombre: 'Cable Lightning', categoria: 'Cables', precio: 699, resumen: '[Ejemplo] 1 m, compatible con iPhone.' },
]

export const PASOS_BOCINA = [
  { titulo: 'Todo empieza con una curva', texto: 'trazamos el perfil de la bocina. el área bajo esa curva define su forma.', formula: 'r = f(y)' },
  { titulo: 'La hacemos girar', texto: 'al rotar la curva 360° sobre su eje nace un sólido de revolución.', formula: 'V = π ∫ f(y)² dy' },
  { titulo: 'Le damos vida', texto: 'rejilla, anillo de luz y acabados con la paleta Infinitech.' },
  { titulo: 'Sonido sin límites', texto: 'así se ve la tecnología cuando se diseña con intención. encuentra la tuya.' },
]

export function placeholderSvg(texto: string, fondo = '#21223f'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="100%" height="100%" fill="${fondo}"/><text x="50%" y="50%" fill="#c7b3f5" font-family="sans-serif" font-size="56" text-anchor="middle">${texto}</text></svg>`
}
```
Los resúmenes llevan `[Ejemplo]` para que nadie confunda los datos de prueba con el catálogo real.

- [ ] **Step 2: Script**

`apps/admin/src/seed/index.ts`:
```ts
import { randomUUID } from 'node:crypto'
import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { PLANTILLA_PEDIDO } from '@/globals/Ajustes'
import { CATEGORIAS, PASOS_BOCINA, PRODUCTOS, placeholderSvg } from './datos'

const payload = await getPayload({ config })

const { totalDocs } = await payload.count({ collection: 'categorias' })
if (totalDocs > 0) {
  console.log('Ya hay datos: el seed no hace nada.')
  process.exit(0)
}

const subir = async (alt: string, data: Buffer, name: string, mimetype: string) =>
  (await payload.create({ collection: 'media', data: { alt }, file: { data, name, mimetype, size: data.length } })).id

const png = async (texto: string, fondo?: string) =>
  sharp(Buffer.from(placeholderSvg(texto, fondo))).png().toBuffer()

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (!email || !password) throw new Error('Definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en apps/admin/.env.')
await payload.create({ collection: 'usuarios', data: { email, password, nombre: 'Admin', rol: 'admin' } })
const apiKey = randomUUID()
await payload.create({
  collection: 'usuarios',
  data: { email: 'tienda@servicio.local', password: randomUUID(), nombre: 'Tienda', rol: 'servicio', enableAPIKey: true, apiKey },
})

const categorias = new Map<string, number>()
for (const c of CATEGORIAS) {
  const icono = await subir(`Ícono de ${c.nombre}`, Buffer.from(c.icono), `${c.nombre}.svg`, 'image/svg+xml')
  const doc = await payload.create({ collection: 'categorias', data: { nombre: c.nombre, orden: c.orden, icono } })
  categorias.set(c.nombre, doc.id as number)
}

const productos: number[] = []
for (const p of PRODUCTOS) {
  const foto = await subir(p.nombre, await png(p.nombre), `${p.nombre}.png`, 'image/png')
  const doc = await payload.create({
    collection: 'productos',
    data: {
      ...p,
      categoria: categorias.get(p.categoria)!,
      fotos: [foto],
      disponibilidad: 'disponible',
      _status: 'published',
    },
  })
  productos.push(doc.id as number)
}

for (const [i, titulo] of ['Audífonos inalámbricos', 'Bocina para fiestas', 'Carga rápida'].entries()) {
  const imagen = await subir(`Arte: ${titulo}`, await png(titulo, '#7846d6'), `arte-${i}.png`, 'image/png')
  await payload.create({
    collection: 'artes',
    data: { imagen, titulo, etiqueta: i === 2 ? 'promocion' : 'nuevo', orden: i, activa: true, producto: productos[i] },
  })
}

const respaldo = await subir('Audífonos Infinitech', await png('Video del hero'), 'hero.png', 'image/png')
await payload.updateGlobal({
  slug: 'inicio',
  data: {
    _status: 'published',
    secciones: [
      { blockType: 'historiaBocina', pasos: PASOS_BOCINA },
      { blockType: 'loNuevo', titulo: 'Lo nuevo.', bajada: 'Mira lo que llegó a Infinitech.' },
      { blockType: 'catalogo', titulo: 'Productos', destacadosPrimero: true },
      { blockType: 'cierre', titulo: 'Encuentra el tuyo', texto: 'bocinas, barras de sonido, cargadores y accesorios para tu día a día.', boton: { texto: 'Ver productos', destino: '#productos' } },
    ],
  },
})
await payload.updateGlobal({
  slug: 'ajustes',
  data: { whatsapp: '50300000000', plantillaMensaje: PLANTILLA_PEDIDO, mantenimiento: false },
})

console.log(`Seed listo. API key del usuario de servicio (guardala en la tienda como PAYLOAD_API_KEY): ${apiKey}`)
console.log(`Imagen de respaldo del hero: media ${respaldo}. Subí el video real y agregá el bloque "Hero con video" desde el panel.`)
process.exit(0)
```
El bloque `heroVideo` no se crea en el seed porque exige un video real; el seed lo avisa.

- [ ] **Step 3: Correr el seed sobre la base de desarrollo**

Antes, vaciar la base de desarrollo (los datos de prueba de las Tasks 3 a 8) con el OK del usuario: en Railway, Postgres → Data → borrar las tablas, o `pnpm --filter admin payload migrate:fresh` (pide confirmación). Definir `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en `apps/admin/.env`.
Run: `pnpm --filter admin seed`
Expected: imprime "Seed listo" con la API key. `GET /api/productos?limit=20` sin sesión devuelve 8 productos; `GET /api/categorias` devuelve 6 ordenadas; `GET /api/globals/inicio` devuelve 4 bloques.
Run de nuevo: `pnpm --filter admin seed`. Expected: "Ya hay datos: el seed no hace nada."

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/seed
git commit -m "feat(admin): datos de ejemplo con categorías, productos, artes e inicio"
```

---

### Task 10: Paquete de tipos compartidos

**Files:**
- Create: `packages/tipos/package.json`, `packages/tipos/src/index.ts`

**Interfaces:**
- Produces: paquete `@infinitech/tipos` que exporta `Producto`, `Categoria`, `Arte`, `Media`, `Pedido`, `Inicio`, `Ajuste` (nombres que genera Payload a partir de los slugs; confirmar en `payload-types.ts`) y `LineaEntrada`.

- [ ] **Step 1: Paquete**

`packages/tipos/package.json`:
```json
{
  "name": "@infinitech/tipos",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/tipos/src/index.ts` (ajustar los nombres a los que aparecen en `payload-types.ts`):
```ts
export type { Producto, Categoria, Arte, Media, Pedido, Inicio, Ajuste } from './payload-types'
export type LineaEntrada = { producto: number; variante?: string | null; cantidad: number }
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm install && pnpm exec tsc --noEmit -p apps/admin/tsconfig.json`
Expected: sin errores. Si `Categoria` o `Ajuste` se llaman distinto en `payload-types.ts`, corregir el `index.ts` con el nombre real.

- [ ] **Step 3: Commit**

```bash
git add packages/tipos pnpm-lock.yaml
git commit -m "feat(tipos): tipos de Payload compartidos para la tienda"
```

---

### Task 11: Migraciones y despliegue del admin en Railway (requiere confirmación)

**Files:**
- Create: `apps/admin/src/migrations/*` (generado)
- Modify: `apps/admin/src/payload.config.ts`

**Interfaces:**
- Produces: admin en `https://admin.<dominio>` (o el dominio de Railway), con migraciones aplicadas al arrancar, archivos en el bucket y la API key de servicio lista para el Plan 2.

- [ ] **Step 1: Migración inicial**

Run: `pnpm --filter admin payload migrate:create inicial`
Expected: crea `apps/admin/src/migrations/<fecha>_inicial.ts` e `index.ts`.

- [ ] **Step 2: Aplicar migraciones en producción al arrancar**

En `payload.config.ts`: `import { migrations } from './migrations'` y en `postgresAdapter({ pool: {...}, prodMigrations: migrations })`. Run: `pnpm --filter admin build`
Expected: build sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/admin
git commit -m "chore(admin): migración inicial y migraciones al arrancar"
```

- [ ] **Step 4: Confirmar con el usuario y crear la infraestructura**

Mostrar al usuario lo que se va a crear y esperar su OK: en el proyecto `infinitech` de Railway, entorno `production`, un Postgres, un bucket y el servicio `admin` conectado al repo de GitHub (pedir al usuario el repo; crear `jotapoldev/infinitech` privado solo si lo pide).
Configuración del servicio `admin`: root directory `/`, build `pnpm install --frozen-lockfile && pnpm --filter admin build`, start `pnpm --filter admin start`, watch paths `apps/admin/**` y `packages/**`. Variables: `DATABASE_URL` (referencia al Postgres de producción), `PAYLOAD_SECRET` y `REVALIDATE_SECRET` nuevos, `NEXT_PUBLIC_SERVER_URL`, `TIENDA_URL` (vacío hasta el Plan 2), `S3_*` desde las credenciales del bucket.

- [ ] **Step 5: Verificar en producción**

Expected: `https://<admin>/admin` muestra el login; crear el primer usuario (queda como admin); subir una imagen y confirmar que su URL apunta al bucket; correr el seed contra producción solo si el usuario lo pide.
