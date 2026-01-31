import type { LucideIcon } from "lucide-react";
import { CalendarDays, Layers, Settings, Shirt } from "lucide-react";

const navItems: Array<{ label: string; icon: LucideIcon; active?: boolean }> = [
  { label: "Closet", icon: Shirt, active: true },
  { label: "Outfits", icon: Layers },
  { label: "Calendario", icon: CalendarDays },
  { label: "Ajustes", icon: Settings },
];

export default function Sidebar() {
  return (
    <nav className="flex h-full w-full flex-row flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 text-slate-600 shadow-lg shadow-slate-900/5 backdrop-blur-lg lg:w-52 lg:flex-col lg:justify-start">
      {navItems.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 lg:justify-start lg:text-sm ${
            item.active
              ? "border border-slate-200 bg-slate-100 text-slate-900 shadow-sm"
              : "border border-transparent"
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 lg:text-sm lg:tracking-normal">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
