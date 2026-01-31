"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  Trash2,
  ImagePlus, // <--- Nuevo icono para subir referencia
  X // <--- Para borrar la referencia
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
  
  // Nuevo estado para la imagen de inspiración
  const [inspoImage, setInspoImage] = useState<File | null>(null);
  const [inspoPreview, setInspoPreview] = useState<string | null>(null);
  const inspoInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [lastUploadMessage, setLastUploadMessage] = useState("Tu closet está listo para nuevas ideas");

  // 1. CARGAR PRENDAS
  useEffect(() => {
    const fetchCloset = async () => {
      const { data, error } = await supabase.from('closet').select('*').order('id', { ascending: false });
      if (data) setPrendas(data);
    };
    fetchCloset();
  }, []);

  // 2. ORDENAR
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

  // 3. SUBIR PRENDA (AL ARMARIO)
  const handleUpload = async (file: File) => {
    try {
      setLastUploadMessage("Subiendo a la nube...");
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage.from('images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      
      setLastUploadMessage("Analizando con IA...");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      let tipo = "Prenda", clima = "General";
      if (res.ok) { const d = await res.json(); tipo = d.tipo; clima = d.clima ? d.clima[0] : "General"; }

      const { data: dbData } = await supabase.from('closet').insert([{ tipo, clima, img: publicUrl }]).select();
      if (dbData) setPrendas(prev => [dbData[0], ...prev]);
      
      setLastUploadMessage(`¡Agregado: ${tipo}!`);
      setUploadOpen(false);
    } catch (e) { console.error(e); setLastUploadMessage("Error al subir."); }
  };

  // 4. GENERAR OUTFIT (TEXTO O IMAGEN)
  const generarOutfit = async () => {
    try {
      setIsGenerating(true);
      let endpoint = "/api/suggest";
      let body: any = {
        inventory: prendas,
        weather: weatherText,
        occasion: userQuery,
      };
      
      // SI HAY IMAGEN DE REFERENCIA, USAMOS EL OTRO ENDPOINT
      let headers: any = { "Content-Type": "application/json" };
      let fetchBody = JSON.stringify(body);

      if (inspoImage) {
        endpoint = "/api/match";
        const formData = new FormData();
        formData.append("image", inspoImage);
        formData.append("inventory", JSON.stringify(prendas));
        formData.append("weather", weatherText);
        // No ponemos Content-Type header manualmente con FormData, el navegador lo hace
        headers = {}; 
        fetchBody = formData as any;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: fetchBody,
      });

      if (!response.ok) throw new Error("Error generando");
      const data = await response.json();
      setSuggestion(data);
      window.scrollTo({ top: 300, behavior: 'smooth' });

    } catch (error) {
      alert("Error al generar outfit. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const borrarPrenda = async (id: number, imgUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Borrar prenda?")) return;
    const backup = [...prendas];
    setPrendas(prendas.filter(p => p.id !== id));
    try {
      await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, imgUrl }) });
    } catch { setPrendas(backup); }
  };

  const handleInspoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInspoImage(file);
      setInspoPreview(URL.createObjectURL(file));
    }
  };

  const clearInspo = () => {
    setInspoImage(null);
    setInspoPreview(null);
    if (inspoInputRef.current) inspoInputRef.current.value = "";
  };

  const resetearBusqueda = () => {
    setSuggestion(null);
    setUserQuery("");
    clearInspo();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 hidden md:flex flex-col py-8 lg:px-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold hidden lg:block">Styler.ai</span>
        </div>
        <nav className="space-y-2">
          <SidebarItem icon={<Shirt size={20} />} label="Mi Closet" active />
          <SidebarItem icon={<Sparkles size={20} />} label="Outfits IA" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col gap-3 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Hola, Alex</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <CloudSun size={16} /> <span>{weatherText}</span>
              </div>
            </div>
            <button onClick={() => setUploadOpen(true)} className="bg-black text-white px-4 py-2 rounded-full flex gap-2 hover:bg-slate-800 transition">
              <Plus size={18} /> <span className="hidden sm:inline">Subir Prenda</span>
            </button>
          </div>
          <p className="text-sm text-indigo-600 font-medium h-6">{lastUploadMessage}</p>
        </header>

        {/* --- CEREBRO DE LA APP --- */}
        <section className={`rounded-3xl p-6 mb-10 border transition-all duration-500 ${suggestion ? "bg-indigo-900 border-indigo-800 text-white" : "bg-white border-indigo-100 shadow-sm"}`}>
          <div className="flex items-center gap-2 font-semibold mb-4 text-sm uppercase tracking-wider text-indigo-400">
            <Sparkles size={16} /> {suggestion ? "Tu Outfit" : "Diseñador IA"}
          </div>

          <h2 className={`text-2xl font-bold mb-6 ${suggestion ? "text-white" : "text-slate-800"}`}>
            {suggestion ? suggestion.title : "¿Qué estilo buscamos hoy?"}
          </h2>

          {suggestion ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <p className="text-indigo-100 mb-6 leading-relaxed">{suggestion.reasoning}</p>
              <button onClick={resetearBusqueda} className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-xl hover:bg-white/20 flex gap-2">
                <RotateCcw size={18} /> Nueva idea
              </button>
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* ÁREA DE INPUT DE REFERENCIA (INSPO) */}
              <div className="flex flex-col gap-3">
                
                {/* Visualización de la imagen subida */}
                {inspoPreview && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md animate-in zoom-in">
                    <img src={inspoPreview} alt="Inspo" className="w-full h-full object-cover" />
                    <button onClick={clearInspo} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 w-full bg-indigo-600/80 text-white text-[10px] text-center py-1 font-bold">
                      REFERENCIA
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder={inspoPreview ? "Añade notas extra: 'Pero usa mis zapatillas blancas'..." : "Describe la ocasión (ej: Cena elegante, Old Money)..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 h-24 text-sm resize-none"
                    />
                  </div>
                  
                  {/* BOTÓN PARA SUBIR FOTO DE REFERENCIA */}
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      ref={inspoInputRef}
                      onChange={handleInspoSelect} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <button 
                      onClick={() => inspoInputRef.current?.click()}
                      className={`h-full px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${inspoPreview ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500'}`}
                      title="Subir foto de referencia (Pinterest/Instagram)"
                    >
                      <ImagePlus size={24} />
                      <span className="text-[10px] font-bold">FOTO</span>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={generarOutfit}
                  disabled={isGenerating || (!userQuery.trim() && !inspoPreview)}
                  className={`w-full py-3 rounded-xl font-medium flex justify-center items-center gap-2 text-white transition ${isGenerating ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"}`}
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  {isGenerating ? "La IA está pensando..." : inspoPreview ? "Recrear este Look" : "Diseñar Outfit"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* GRID DE ROPA */}
        <h3 className="font-bold text-lg mb-4 text-slate-800">Tu Colección ({prendas.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-20">
          {sortedPrendas.map((prenda) => {
            const isSelected = suggestion?.selectedIds.includes(prenda.id);
            return (
              <div key={prenda.id} className={`group bg-white rounded-2xl p-3 border shadow-sm relative ${isSelected ? "border-indigo-500 ring-4 ring-indigo-500/20 order-first" : "border-slate-100"}`}>
                 <button onClick={(e) => borrarPrenda(prenda.id, prenda.img, e)} className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 z-20 shadow-sm transition">
                  <Trash2 size={14} />
                </button>
                {isSelected && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex gap-1 z-20"><CheckCircle2 size={12}/> ELEGIDO</div>}
                <div className="aspect-[3/4] rounded-xl bg-slate-100 mb-3 overflow-hidden relative">
                  <img src={prenda.img} alt={prenda.tipo} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-700">{prenda.clima}</div>
                </div>
                <h4 className={`font-medium ${isSelected ? "text-indigo-700 font-bold" : "text-slate-900"}`}>{prenda.tipo}</h4>
              </div>
            );
          })}
        </div>
      </main>
      <UploadModal isOpen={isUploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
      {icon} <span className="hidden lg:block font-medium text-sm">{label}</span>
    </div>
  );
}