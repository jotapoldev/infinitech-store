"use client";

import "./globals.css";

export default function ErrorGlobal({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body className="grid min-h-screen place-items-center px-4 text-center font-sans">
        <main className="flex max-w-[520px] flex-col items-center gap-4">
          <span className="font-mono text-sm tracking-[0.2em] text-acento-claro">500</span>
          <h1 className="titulo-display text-[36px]">Algo falló de nuestro lado.</h1>
          <p className="text-white/70">Volvé a intentarlo en un momento.</p>
          <button type="button" onClick={retry} className="presionable min-h-[50px] rounded-full bg-acento px-7 font-semibold">
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
