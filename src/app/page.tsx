"use client";

import { useState, useMemo, useEffect } from "react";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/lib/supabase";
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
  PenLine,
  RotateCcw,
  Trash2 // <--- Importado el icono de basura
} from "lucide-react";
import UploadModal from "@/components/UploadModal";

interface Suggestion {
  title: string;
  reasoning: string;
  selectedIds: number[];
}

export default function Home() {
  const [userQuery, setUserQuery] = useState(""); 
  const { weatherText } = useWeather();
  const [isUploadOpen, setUploadOpen] = useState(false);
  
  const [prendas, setPrendas] = useState<any[]>([]); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [lastUploadMessage, setLastUploadMessage] = useState("Tu closet está listo para nuevas ideas");

  // 1. CARGAR PRENDAS
  useEffect(() => {
    const fetchCloset = async () => {
      const { data, error } = await supabase
        .from('closet')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error("Error cargando closet:", error);
      } else if (data) {
        setPrendas(data);
      }
    };
    fetchCloset();
  }, []);

  // 2. ORDENAR PRENDAS
  const sortedPrendas = useMemo(() => {
    if (!suggestion) return prendas;
    
    return [...prendas].sort((a, b) => {
      const isA = suggestion.selectedIds.includes(a.id);
      const isB = suggestion.selectedIds.includes(b.id);
      if (isA && !isB) return -1;
      if (!isA && isB) return 1;
      return 0;
    });
  }, [prendas, suggestion]);

  // 3. SUBIR PRENDA
  const handleUpload = async (file: File) => {
    try {
      setLastUploadMessage("Subiendo a la nube...");

      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(fileName);

      setLastUploadMessage("Analizando estilo con IA...");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      
      let tipoDetectado = "Prenda";
      let climaDetectado = "General";

      if (response.ok) {
        const geminiData = await response.json();
        tipoDetectado = geminiData.tipo || "Prenda";
        climaDetectado = geminiData.clima ? geminiData.clima[0] : "General";
      }

      const { data: dbData, error: dbError } = await supabase
        .from('closet')
        .insert([
          { 
            tipo: tipoDetectado, 
            clima: climaDetectado, 
            img: publicUrl 
          }
        ])
        .select();

      if (dbError) throw dbError;

      if (dbData) {
        setPrendas((prev) => [dbData[0], ...prev]);
      }
      
      setLastUploadMessage(`¡Guardado en la nube! Agregado: ${tipoDetectado}`);
      setUploadOpen(false);

    } catch (error) {
      console.error("Error completo:", error);
      setLastUploadMessage("Error al guardar en la nube.");
    }
  };

  // 4. NUEVA FUNCIÓN: BORRAR PRENDA
  const borrarPrenda = async (id: number, imgUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que al hacer clic se seleccione la prenda o haga otra cosa
    
    if (!confirm("¿Seguro que quieres borrar esta prenda?")) return;

    // Actualización Optimista: Borramos de la pantalla inmediatamente
    const copiaSeguridad = [...prendas];
    setPrendas(prendas.filter(p => p.id !== id));

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, imgUrl })
      });
      
      if (!res.ok) throw new Error("Error al borrar");
      
      // Si todo sale bien, no hacemos nada más.

    } catch (error) {
      alert("No se pudo borrar la prenda, intenta de nuevo.");
      setPrendas(copiaSeguridad); // Si falla, devolvemos la prenda a la lista
    }
  };

  const generarOutfit = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: prendas,
          weather: weatherText,
          occasion: userQuery,
        }),
      });

      if (!response.ok) throw new Error("Error generando outfit");
      const data = await response.json();
      setSuggestion(data);
      window.scrollTo({ top: 300, behavior: 'smooth' });

    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar. Revisa la consola.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetearBusqueda = () => {
    setSuggestion(null);
    setUserQuery("");
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col items-center lg:items-start py-8 lg:px-6 fixed lg:relative z-10 h-full hidden md:flex">
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

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
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

        {/* --- BANNER DE INTELIGENCIA ARTIFICIAL --- */}
        <section className={`rounded-3xl p-6 mb-10 border relative overflow-hidden transition-all duration-500 ${suggestion ? "bg-indigo-900 border-indigo-800 text-white shadow-xl shadow-indigo-200" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100"}`}>
          <div className="relative z-10">
            <div className={`flex items-center gap-2 font-semibold mb-2 text-sm uppercase tracking-wider ${suggestion ? "text-indigo-200" : "text-indigo-600"}`}>
              <Sparkles size={16} /> {suggestion ? "Tu Outfit Personalizado" : "Asistente de Estilo"}
            </div>
            
            <h2 className={`text-xl lg:text-3xl font-bold mb-4 ${suggestion ? "text-white" : "text-slate-800"}`}>
              {suggestion ? suggestion.title : "¿Qué tienes en mente hoy?"}
            </h2>
            
            {suggestion ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-indigo-100 max-w-md mb-6 leading-relaxed">
                  {suggestion.reasoning}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={resetearBusqueda}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <RotateCcw size={18} /> Nueva idea
                  </button>
                </div>
              </div>
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
                <button 
                  onClick={generarOutfit}
                  disabled={isGenerating || !userQuery.trim()}
                  className={`mt-4 px-5 py-2.5 rounded-xl font-medium shadow-sm transition flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 ${isGenerating ? "opacity-75 cursor-wait" : ""}`}
                >
                  {isGenerating ? (
                    <> <Loader2 className="animate-spin" size={18} /> Pensando... </>
                  ) : (
                    <> <Sparkles size={18} /> Diseñar mi Outfit </>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
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
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          {suggestion ? "Prendas Seleccionadas & Colección" : "Tu Colección Completa"}
          <span className="text-slate-400 text-sm font-normal">({prendas.length})</span>
        </h3>

        {/* MENSAJE SI EL CLOSET ESTÁ VACÍO */}
        {prendas.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 mb-8">
            <p className="text-slate-500 mb-2">Tu armario digital está vacío.</p>
            <p className="text-sm text-slate-400">¡Sube tu primera prenda para empezar!</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 pb-20">
          {sortedPrendas.map((prenda) => {
            const isSelected = suggestion?.selectedIds.includes(prenda.id);
            return (
              <div
                key={prenda.id}
                className={`group bg-white rounded-2xl p-3 border shadow-sm transition-all duration-500 relative ${
                  isSelected 
                    ? "border-indigo-500 ring-4 ring-indigo-500/20 shadow-indigo-300 scale-[1.02] z-10 order-first" 
                    : "border-slate-100 hover:shadow-md opacity-80 hover:opacity-100"
                }`}
              >
                {/* Botón de Borrar (NUEVO) */}
                <button 
                  onClick={(e) => borrarPrenda(prenda.id, prenda.img, e)}
                  className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-20 shadow-sm"
                  title="Borrar prenda"
                >
                  <Trash2 size={14} />
                </button>

                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 animate-in zoom-in spin-in-3">
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

function SidebarItem({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      {icon}
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </div>
  );
}