import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // ¡AQUÍ ESTÁ LA SOLUCIÓN!
  // Usamos el modelo que SI aparece en tu lista: "gemini-2.0-flash"
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });
    }

    console.log(`📸 Analizando con Gemini 2.0 Flash: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    
    // Gemini 2.0 es muy flexible, pero definimos el tipo por si acaso
    const mimeType = file.type || "image/jpeg";

    const prompt = `
      Eres un experto en moda. Analiza esta imagen.
      
      Responde ÚNICAMENTE con un objeto JSON válido (sin markdown \`\`\`).
      
      Campos requeridos:
      - "tipo": Nombre específico de la prenda (ej: "Zapatillas Nike Air", "Chaqueta de Cuero Negra").
      - "clima": Elige uno: "Caluroso", "Templado", "Frío", "Lluvia".
      - "categoria": Elige uno: "top", "bottom", "shoes", "outerwear", "accessory".
      - "color": Color principal dominante.

      Ejemplo: { "tipo": "Jeans Rectos", "clima": "Templado", "categoria": "bottom", "color": "Azul" }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    console.log("🤖 Respuesta:", text.substring(0, 50) + "...");

    // Limpieza de JSON
    text = text.replace(/```json|```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ ERROR ANALYZE:", error);
    
    return NextResponse.json({ 
      tipo: "Prenda (Error IA)", 
      clima: "General", 
      categoria: "other",
      color: "N/A",
      debug_error: error.message
    });
  }
}