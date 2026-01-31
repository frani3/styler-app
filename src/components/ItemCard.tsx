import Image from "next/image";

type ItemCardProps = {
  title: string;
  category: string;
  weatherTag: string;
  image: string;
};

export default function ItemCard({ title, category, weatherTag, image }: ItemCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-700 shadow-sm backdrop-blur-sm">
          {weatherTag}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {category}
          </span>
        </div>
        <button
          type="button"
          className="mt-auto rounded-2xl border border-slate-200 bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Añadir a outfit
        </button>
      </div>
    </article>
  );
}
