import type { Metadata, Viewport } from "next";
import { Archivo_Black } from "next/font/google";
import { Carrito } from "@/components/carrito/Carrito";
import { CarritoProvider } from "@/components/carrito/CarritoProvider";
import "./globals.css";

const archivo = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: { default: "Infinitech · Tecnología y accesorios", template: "%s · Infinitech" },
  description: "Bocinas, barras de sonido, audífonos, cargadores y accesorios en El Salvador.",
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${archivo.variable} h-full`}>
      <body className="min-h-full font-sans">
        <CarritoProvider>
          {children}
          <Carrito />
        </CarritoProvider>
      </body>
    </html>
  );
}
