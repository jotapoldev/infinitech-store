import Link from "next/link";

type Accion = { texto: string; href: string; externa?: boolean };

// Ilustración: la bocina del sólido de revolución en wireframe, en el morado de la marca.
export function BocinaWire({ className = "size-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="60" cy="18" rx="34" ry="8" stroke="#9d78ec" strokeWidth="2" />
      <ellipse cx="60" cy="142" rx="34" ry="8" stroke="#9d78ec" strokeWidth="2" />
      <path d="M26 18c-6 30-6 94 0 124M94 18c6 30 6 94 0 124" stroke="#c7b3f5" strokeWidth="2" />
      <path d="M43 13c-3 34-3 100 0 136M77 13c3 34 3 100 0 136M60 10v140" stroke="#7846d6" strokeWidth="1.5" strokeDasharray="4 5" />
      <ellipse cx="60" cy="40" rx="38" ry="9" stroke="#7846d6" strokeWidth="1.5" strokeDasharray="4 5" />
      <ellipse cx="60" cy="80" rx="40" ry="10" stroke="#c7b3f5" strokeWidth="2" />
      <ellipse cx="60" cy="120" rx="38" ry="9" stroke="#7846d6" strokeWidth="1.5" strokeDasharray="4 5" />
    </svg>
  );
}

export function EstadoVacio({
  titulo,
  texto,
  acciones = [],
  ilustracion = <BocinaWire />,
  compacto = false,
}: {
  titulo: string;
  texto?: string;
  acciones?: Accion[];
  ilustracion?: React.ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${compacto ? "py-8" : "py-16"}`}>
      {ilustracion}
      <h3 className="mt-2 text-[19px] font-semibold">{titulo}</h3>
      {texto && <p className="max-w-[380px] text-[15px] leading-relaxed text-white/65">{texto}</p>}
      {acciones.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          {acciones.map((a, i) =>
            a.externa ? (
              <a
                key={a.texto}
                href={a.href}
                target="_blank"
                rel="noreferrer"
                className={`presionable inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold ${i === 0 ? "bg-acento" : "border border-white/24"}`}
              >
                {a.texto}
              </a>
            ) : (
              <Link
                key={a.texto}
                href={a.href}
                className={`presionable inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold ${i === 0 ? "bg-acento" : "border border-white/24"}`}
              >
                {a.texto}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
