import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}
