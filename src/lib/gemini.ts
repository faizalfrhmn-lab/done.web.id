import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTimelineEntries(prompt: string, startDate?: string, dayOffs?: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Project Manager assistant. Convert the provided schedule into a structured JSON list of events.
      
      Project Parameters:
      - Start Date: ${startDate || "today"}
      - Days to Skip (Weekend/Day Off): ${dayOffs?.join(", ") || "None"}
      
      Logic for Processing:
      1. Use common Indonesian terms: "Minggu" = Week, "Senin" = Monday, "Selasa" = Tuesday, "Rabu" = Wednesday, "Kamis" = Thursday, "Jumat" = Friday, "Sabtu" = Saturday, "Minggu" (day) = Sunday.
      2. "Minggu 1" starts at the Start Date. "Minggu 2" is the following week.
      3. For each day mentioned (Senin, Selasa, etc.), calculate the exact date based on the week number and the Start Date.
      4. CRITICAL: If a calculated date falls on a "Day Off" (${dayOffs?.join(", ")}), skip to the next available working day if the schedule implies sequential tasks.
      5. Extract the core task from the text for the "description".
      
      Output Format:
      Return ONLY an array of objects: [{"date": "YYYY-MM-DD", "description": "Short task description"}]
      
      Raw Schedule Text:
      "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["date", "description"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
}
