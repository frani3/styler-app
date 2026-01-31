"use client";

import { useState, type ReactNode } from "react";
import { useWeather } from "@/hooks/useWeather";
import {
  CloudSun,
  Calendar,
  Settings,
  Shirt,
  Plus,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  PenLine, // Nuevo icono para indicar escritura
} from "lucide-react";
import UploadModal from "@/components/UploadModal";

interface Suggestion {
  title: string;
  reasoning: string;
  selectedIds: number[];
}

const PRENDAS_EJEMPLO = [
  {
    id: 1,
    tipo: "Abrigo Lana",
    clima: "Frío",
    img: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&q=80",
  },
  {
    id: 2,
    tipo: "Jeans Negros", // Cambié el nombre para probar tu ejemplo
    clima: "Templado",
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80",
  },
  {
    id: 3,
    tipo: "Sneakers Blancos",
    clima: "Cualquiera",
    img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
  },
  {
    id: 4,
    tipo: "Polera Básica",
    clima: "Caluroso",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
  },
];

export default function Home() {
  // Estado para lo que escribe el usuario (ej: "Voy a la U...")
  const [userQuery, setUserQuery] = useState(""); 
  
  const { weatherText } = useWeather();
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [prendas, setPrendas] = useState(PRENDAS_EJEMPLO);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [lastUploadMessage, setLastUploadMessage] = useState(
    "Tu closet está listo para nuevas ideas"
  );

  const handleUpload = async (file: File) => {
    try {
      setLastUploadMessage("Analizando con Gemini AI...");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Falló el análisis");
      const data = await response.json();

      const nuevaPrenda = {
        id: Date.now(),
        tipo: data.tipo || "Prenda",
        clima: data.clima ? data.clima[0] : "General",
        img: URL.createObjectURL(file),
      };

      setPrendas([nuevaPrenda, ...prendas]);
      setLastUploadMessage(`¡Listo! Agregado: ${data.tipo}`);
      setUploadOpen(false);
    } catch (error) {
      console.error(error);
      setLastUploadMessage("Error al analizar la imagen.");
    }
  };

  const generarOutfit = async () => {
    try {
      setIsGenerating(true);
      setSuggestion(null);

      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: prendas,
          weather: weatherText,
          occasion: userQuery, // <--- Enviamos lo que escribiste
        }),
      });

      if (!response.ok) throw new Error("Error generando outfit");
      const data = await response.json();
      setSuggestion(data);

    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar. Revisa la consola.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col items-center lg:items-start py-8 lg:px-6 fixed lg:relative z-10 h-full">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold hidden lg:block tracking-tight">Styler.ai</span>
        </div>
        <nav className="flex-1 w-full space-y-2">
          <SidebarItem icon={<Shirt size={20} />} label="Mi Closet" active />
          <SidebarItem icon={<Sparkles size={20} />} label="Outfits IA" />
          <SidebarItem icon={<Calendar size={20} />} label="Calendario" />
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-100 w-full">
          <SidebarItem icon={<Settings size={20} />} label="Ajustes" />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 lg:pl-80">
        <header className="flex flex-col gap-3 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Buenos días, Alex</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                <CloudSun size={16} />
                <span>Concepción · {weatherText}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUploadOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Subir Prenda</span>
              </button>
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500" />
              </div>
            </div>
          </div>
          <p className="text-sm text-indigo-600 font-medium h-6">{lastUploadMessage}</p>
        </header>

        {/* --- BANNER DE INTELIGENCIA ARTIFICIAL MEJORADO --- */}
        <section className={`rounded-3xl p-6 mb-10 border relative overflow-hidden transition-all duration-500 ${suggestion ? "bg-indigo-900 border-indigo-800 text-white" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100"}`}>
          <div className="relative z-10">
            <div className={`flex items-center gap-2 font-semibold mb-2 text-sm uppercase tracking-wider ${suggestion ? "text-indigo-200" : "text-indigo-600"}`}>
              <Sparkles size={16} /> {suggestion ? "Tu Outfit Personalizado" : "Asistente de Estilo"}
            </div>
            
            <h2 className={`text-xl lg:text-3xl font-bold mb-4 ${suggestion ? "text-white" : "text-slate-800"}`}>
              {suggestion ? suggestion.title : "¿Qué tienes en mente hoy?"}
            </h2>
            
            {/* Si ya hay sugerencia, mostramos el razonamiento. Si no, mostramos el INPUT */}
            {suggestion ? (
              <p className="text-indigo-100 max-w-md mb-6">{suggestion.reasoning}</p>
            ) : (
              <div className="mb-6 max-w-lg">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block flex items-center gap-2">
                  <PenLine size={12} /> Cuéntame tu plan o qué quieres usar
                </label>
                <textarea
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ej: Voy a la universidad, quiero estar cómoda y usar los pantalones negros..."
                  className="w-full bg-white/50 backdrop-blur-sm border border-indigo-100 rounded-xl p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-sm shadow-sm"
                />
              </div>
            )}

            <button 
              onClick={generarOutfit}
              disabled={isGenerating || (!suggestion && !userQuery.trim())} // Deshabilitado si está vacío
              className={`px-5 py-2.5 rounded-xl font-medium shadow-sm transition flex items-center gap-2 ${
                suggestion 
                  ? "bg-white text-indigo-900 hover:bg-indigo-50" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
              } ${isGenerating ? "opacity-75 cursor-wait" : ""}`}
            >
              {isGenerating ? (
                <> <Loader2 className="animate-spin" size={18} /> Pensando... </>
              ) : (
                <> <Sparkles size={18} /> {suggestion ? "Probar otra idea" : "Diseñar mi Outfit"} </>
              )}
            </button>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        </section>

        {/* Buscador */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar en tu closet..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition shadow-sm"
          />
        </div>

        {/* Grid de Ropa */}
        <h3 className="font-bold text-lg mb-4">Tu Colección</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 pb-20">
          {prendas.map((prenda) => {
            const isSelected = suggestion?.selectedIds.includes(prenda.id);
            return (
              <div
                key={prenda.id}
                className={`group bg-white rounded-2xl p-3 border shadow-sm transition-all cursor-pointer relative ${
                  isSelected 
                    ? "border-indigo-500 ring-4 ring-indigo-500/20 shadow-indigo-200 scale-105 z-10" 
                    : "border-slate-100 hover:shadow-md"
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 animate-in fade-in zoom-in">
                    <CheckCircle2 size={12} /> ELEGIDO
                  </div>
                )}
                <div className="aspect-[3/4] rounded-xl bg-slate-100 mb-3 overflow-hidden relative">
                  <img src={prenda.img} alt={prenda.tipo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold shadow-sm text-slate-700">
                    {prenda.clima}
                  </div>
                </div>
                <h4 className={`font-medium ${isSelected ? "text-indigo-700 font-bold" : "text-slate-900"}`}>
                  {prenda.tipo}
                </h4>
                <p className="text-xs text-slate-500 mt-1">En closet</p>
              </div>
            );
          })}
          <button 
            onClick={() => setUploadOpen(true)}
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition aspect-[3/4] bg-slate-50/50"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-medium">Añadir</span>
          </button>
        </div>
      </main>
      <UploadModal isOpen={isUploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      {icon}
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </div>
  );
}