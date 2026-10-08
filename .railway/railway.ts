import { defineRailway, project, service } from "railway/iac";

// Mockup temporal de la tienda. El admin y la base se agregan aquí cuando se despliegue el Plan 1.
export default defineRailway(() => {
  const tienda = service("tienda", {
    build: "pnpm --filter tienda build",
    start: "pnpm --filter tienda start",
    healthcheck: "/",
  });

  return project("infinitech-mockup", {
    resources: [tienda],
  });
});
