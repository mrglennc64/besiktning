import { GoogleGenAI, Type } from "@google/genai";
import type { Content, FunctionDeclaration } from "@google/genai";
import { getCatalog, getMatchableEntries, type NoteringEntry } from "./noteringar";

export interface PhotoMatch {
  notering_id: string;
  category: string;
  title: string;
  body: string;
  ai_match_confidence: number;
  reasoning: string;
}

const MODEL = "gemini-2.5-flash";

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) not set in env");
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_PROMPT = `Du är assistent åt en svensk besiktningsman som utför överlåtelsebesiktning enligt SBR-modellen.

Användaren laddar upp ett foto från en besiktning. Din uppgift är att MATCHA fotot mot exakt 3 entries från katalogen av kanoniska noteringar nedan. Du får INTE hitta på egen text — endast välja id:n från katalogen.

Varje notering har: id, category (byggnadsdel), title (kort observation). Välj de 3 som bäst beskriver vad du ser i fotot.

Rangordna efter relevans. Sätt ai_match_confidence mellan 0.0 och 1.0 baserat på hur väl fotot matchar — var ärlig, sätt lågt om fotot är oklart eller du är osäker.

Skriv reasoning kort på svenska (1 mening) som förklarar varför du valde den noteringen.

Om inget i katalogen passar (t.ex. fotot är inte från en besiktning, eller det är ett tomt rum utan defekter): returnera ändå 3 bästa gissningar men med ai_match_confidence under 0.3 på alla tre.`;

export async function matchPhotoToNoteringar(
  imageBase64: string,
  mimeType: string,
  categoryFilter?: string,
): Promise<PhotoMatch[]> {
  const entries = await getMatchableEntries(categoryFilter);
  const catalogText = entries
    .map((e) => `${e.id} | ${e.category} | ${e.title}`)
    .join("\n");

  const genai = client();
  const result = await genai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: `KATALOG:\n${catalogText}\n\nMatcha fotot mot 3 entries från katalogen ovan.` },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matches: {
            type: Type.ARRAY,
            minItems: "3",
            maxItems: "3",
            items: {
              type: Type.OBJECT,
              properties: {
                notering_id: { type: Type.STRING },
                ai_match_confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
              },
              required: ["notering_id", "ai_match_confidence", "reasoning"],
            },
          },
        },
        required: ["matches"],
      },
    },
  });

  const text = result.text;
  if (!text) throw new Error("Gemini returned no text");
  const parsed = JSON.parse(text) as {
    matches: Array<Pick<PhotoMatch, "notering_id" | "ai_match_confidence" | "reasoning">>;
  };

  const catalog = await getCatalog();
  const byId = new Map<string, NoteringEntry>(catalog.entries.map((e) => [e.id, e]));

  return parsed.matches.map((m) => {
    const entry = byId.get(m.notering_id);
    return {
      notering_id: m.notering_id,
      category: entry?.category ?? "(okänd)",
      title: entry?.title ?? "",
      body: entry?.body ?? "",
      ai_match_confidence: m.ai_match_confidence,
      reasoning: m.reasoning,
    };
  });
}

export interface ToolCall { name: string; args: Record<string, unknown> }
export interface ToolChatResult { functionCalls: ToolCall[]; text: string }

/**
 * One round-trip of a function-calling chat. Caller runs the loop: pass the
 * running `contents`, get back either tool calls (execute, append a
 * functionResponse, call again) or final text.
 */
export async function runToolChat(
  systemInstruction: string,
  contents: Content[],
  tools: FunctionDeclaration[],
): Promise<ToolChatResult> {
  const genai = client();
  const result = await genai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction, tools: [{ functionDeclarations: tools }] },
  });
  const calls = (result.functionCalls ?? []).map((c) => ({
    name: c.name ?? "",
    args: (c.args ?? {}) as Record<string, unknown>,
  }));
  return { functionCalls: calls, text: result.text ?? "" };
}
