import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  // Usamos el modelo rápido que sabemos que te funciona
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File; // La foto de inspiración
    const inventory = formData.get("inventory") as string; // Tu armario en texto JSON
    const weather = formData.get("weather") as string;

    if (!file || !inventory) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Convertir imagen a Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `
      Actúa como un estilista personal experto.
      
      OBJETIVO:
      El usuario quiere recrear el look de esta IMAGEN DE REFERENCIA usando SOLAMENTE su propia ropa.
      
      CONTEXTO:
      1. Clima actual: ${weather}
      2. Inventario del usuario (Tu única fuente de ropa): ${inventory}

      INSTRUCCIONES:
      1. Analiza la imagen: Identifica el estilo (ej: Old Money, Streetwear), colores clave y tipo de prendas.
      2. Busca en el Inventario: Encuentra los IDs de las prendas del usuario que más se parezcan a las de la foto.
         - Si la foto tiene una camisa beige y el usuario tiene una blanca, úsala (es la mejor coincidencia).
         - Si hace frío y la foto es de verano, adapta el look ligeramente (añade una chaqueta del inventario si combina).
      
      FORMATO DE RESPUESTA (JSON):
      {
        "selectedIds": [IDs de las prendas seleccionadas],
        "title": "Nombre del Look (ej: Old Money Vibes)",
        "reasoning": "Explica por qué elegiste esas prendas para imitar la foto."
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: mimeType } }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpieza JSON
    text = text.replace(/```json|```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) text = text.substring(start, end + 1);

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Error en Match:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}