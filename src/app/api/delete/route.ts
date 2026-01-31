import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { id, imgUrl } = await request.json();

    if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

    // 1. Borrar de la Base de Datos
    const { error: dbError } = await supabase
      .from('closet')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // 2. Borrar la imagen del Storage (Opcional pero recomendado para ahorrar espacio)
    // Extraemos el nombre del archivo de la URL
    if (imgUrl) {
      const fileName = imgUrl.split('/').pop(); // Saca lo último después de la "/"
      if (fileName) {
        await supabase.storage.from('images').remove([fileName]);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error borrando:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}