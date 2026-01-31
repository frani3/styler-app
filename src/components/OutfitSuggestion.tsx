import Image from "next/image";

type OutfitPiece = {
  slot: string;
  name: string;
  detail: string;
  image: string;
};

type OutfitSuggestionProps = {
  pieces: OutfitPiece[];
};

export default function OutfitSuggestion({ pieces }: OutfitSuggestionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Sugerencia de IA</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Tu conjunto ideal para hoy
          </h2>
          <p className="text-sm text-slate-500">Clima: Concepción, 22°C · Soleado</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          Guardar conjunto
        </button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {pieces.map((piece) => (
          <article
            key={piece.slot}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
          >
            <div className="relative h-36 w-full overflow-hidden rounded-t-2xl">
              <Image
                src={piece.image}
                alt={piece.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 30vw, 100vw"
                className="object-cover"
              />
              <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white">
                {piece.slot}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{piece.name}</p>
              <p className="text-xs text-slate-500">{piece.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
