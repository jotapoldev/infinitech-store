import { defineRailway, github, project, service } from "railway/iac";

// Mockup temporal de la tienda. El admin y la base se agregan aquí cuando se despliegue el Plan 1.
export default defineRailway(() => {
  const tienda = service("tienda", {
    source: github("jotapoldev/infinitech-store", { branch: "main" }),
    build: "pnpm --filter tienda build",
    start: "pnpm --filter tienda start",
    healthcheck: "/",
    // Duerme sin tráfico para no gastar; la primera visita tarda unos segundos en despertarlo.
    deploy: { sleepApplication: true },
  });

  return project("infinitech-mockup", {
    resources: [tienda],
  });
});
