import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { MKB } from "@/lib/mkb";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { userText, modelId, cineTokens } = await req.json();
  const mkb = (MKB as any)[modelId];
  const system = `You are a senior prompt engineer. Output one prompt optimized for ${mkb.name}. If video, include motion.`;
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system,
    prompt: `${userText}${cineTokens ? ", " + cineTokens : ""}. Add: ${mkb.suggest.join(", ")}.`
  });
  return NextResponse.json({ prompt: text.trim() });
}
