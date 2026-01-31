import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta API Key" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // --- CAMBIO CLAVE AQUÍ ---
  // NO uses "gemini-2.5-pro" (no existe/no tienes acceso).
  // Usamos "gemini-1.5-flash" que es rápido, bueno y GRATIS.
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
  });

  try {
    const body = await request.json();
    const { inventory, weather, occasion } = body;
    const safeInventory = inventory || [];

    // Prompt estricto para evitar errores de parseo
    const promptText = `
      Eres un estilista experto (AI).
      Objetivo: Crear un outfit con la ropa del usuario.
      
      Contexto:
      - Clima: ${weather || "Normal"}
      - Ocasión: "${occasion || "Casual"}"
      - Armario (JSON): ${JSON.stringify(safeInventory)}

      REGLAS CRÍTICAS:
      1. Responde SOLO con un JSON válido. NADA de texto extra.
      2. NO uses Markdown (\`\`\`json).
      3. Usa IDs reales del armario.

      Formato JSON esperado:
      {
        "selectedIds": [1, 5],
        "title": "Nombre del Outfit",
        "reasoning": "Por qué elegiste esto."
      }
    `;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    let text = response.text();

    // Limpieza de seguridad (por si la IA desobedece)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    } else {
      throw new Error("La IA no devolvió un JSON válido");
    }

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Error Gemini:", error);
    
    // Mensaje amigable si vuelves a superar la cuota (aunque con flash es difícil)
    if (error.message?.includes("429")) {
        return NextResponse.json({ error: "El servidor está ocupado (Límite de cuota), intenta en 1 minuto." }, { status: 429 });
    }

    return NextResponse.json({ error: "Error generando outfit" }, { status: 500 });
  }
}