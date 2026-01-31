import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Language = "en" | "es";

export interface ChatbotAction {
  type: "capture_lead" | "link" | "none";
  payload?: string;
  label?: {
    en: string;
    es: string;
  };
}

export interface ChatbotResponse {
  message: string;
  intent: string;
  confidence: number;
  action?: ChatbotAction;
  suggestedAction?: string; // Backward compatibility
}

interface IntentDefinition {
  id: string;
  category: string;
  patterns: string[];
  responses: {
    en: string[];
    es: string[];
  };
  action?: {
    type: "capture_lead" | "link";
    payload?: string;
    label?: {
      en: string;
      es: string;
    };
  };
}

// Load intents from JSON
let loadedIntents: IntentDefinition[] = [];
try {
  const dataPath = path.join(__dirname, "data/chatbot-intents.json");
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, "utf-8");
    loadedIntents = JSON.parse(rawData);
  }
} catch (e) {
  console.error("Failed to load chatbot intents:", e);
}

export async function processMessage(message: string, language: Language = "en"): Promise<ChatbotResponse> {
  const msg = message.toLowerCase();
  console.log(`[Chatbot] Processing message: "${msg}" against ${loadedIntents.length} intents`);
  
  for (const intent of loadedIntents) {
    // Check all patterns for this intent
    const isMatch = intent.patterns.some(p => {
      try {
        return new RegExp(p, "i").test(msg);
      } catch (e) {
        return false;
      }
    });

    if (isMatch) {
      const responses = language === "es" ? intent.responses.es : intent.responses.en;
      const responseText = responses[Math.floor(Math.random() * responses.length)];
      
      const action: ChatbotAction = intent.action ? {
        type: intent.action.type,
        payload: intent.action.payload,
        label: intent.action.label
      } : { type: "none" };

      return {
        message: responseText,
        intent: intent.id,
        confidence: 0.9,
        action: action,
        suggestedAction: action.type === "capture_lead" ? "capture_lead" : "none", // For backward compat
      };
    }
  }

  return {
    message: language === "es" 
      ? "Lo siento, no entiendo. ¿Puedes reformularlo o dejar tus datos para que te contactemos?"
      : "I'm sorry, I don't understand. Can you rephrase or leave your details for us to contact you?",
    intent: "fallback",
    confidence: 0.1,
    action: { type: "capture_lead" },
    suggestedAction: "capture_lead",
  };
}
