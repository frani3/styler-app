import { GoogleGenerativeAI } from "@google/generative-ai";

// Es mejor manejar esto en el lado del servidor (API Routes) 
// para no exponer tu API KEY en el navegador.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash" 
});