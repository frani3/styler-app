import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Falta la API Key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Usamos el modelo 2.5 Flash que sabemos que tienes
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const body = await request.json();
    const { inventory, weather, occasion } = body;

    // Validación básica para evitar errores si no hay datos
    if (!inventory || !weather || !occasion) {
      // Si falta algo, usamos valores por defecto para no romper la app
      console.log("Faltan datos, usando valores por defecto para prueba...");
    }

    const safeInventory = inventory || [];
    const safeWeather = weather || "Templado";
    const safeOccasion = occasion || "Casual";

    // PROMPT DE SISTEMA (Incrustado en el mensaje de usuario)
    const promptText = `
      ACTÚA COMO: Un estilista de moda personal experto.
      OBJETIVO: Seleccionar el mejor conjunto de ropa del inventario proporcionado.

      CONTEXTO:
      - Clima actual: ${safeWeather}
      - Ocasión: ${safeOccasion}
      - Inventario Disponible (JSON): ${JSON.stringify(safeInventory)}

      INSTRUCCIONES:
      1. Elige una combinación lógica (Top + Bottom + Zapatos).
      2. IMPORTANTE: No inventes prendas. Usa SOLO los IDs que vienen en el inventario.
      3. Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido.

      FORMATO DE RESPUESTA JSON:
      {
        "selectedIds": [123, 456], 
        "title": "Título del outfit",
        "reasoning": "Explicación breve."
      }
    `;

    // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
    // En lugar de pasar el texto directo, construimos la estructura exacta
    // que pide la API para evitar cualquier ambigüedad de "roles".
    const result = await model.generateContent({
      contents: [
        {
          role: "user", // Forzamos el rol "user" explícitamente
          parts: [
            { text: promptText }
          ]
        }
      ]
    });

    const response = await result.response;
    const text = response.text();

    // Limpieza de Markdown y Parseo
    const cleanedText = text.replace(/```json|```/g, "").trim();
    
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Error parseando JSON:", text);
        // Fallback en caso de que la IA falle al dar formato JSON
        return NextResponse.json({ 
            title: "Sugerencia Simple", 
            reasoning: "Aquí tienes una idea basada en tu ropa.", 
            selectedIds: safeInventory.length > 0 ? [safeInventory[0].id] : [] 
        });
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Error CRÍTICO en Suggest:", error);
    return NextResponse.json(
      { error: "Error interno", details: error.message }, 
      { status: 500 }
    );
  }
}