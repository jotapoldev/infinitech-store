const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatearPrecio = (centavos: number) => usd.format(centavos / 100);
