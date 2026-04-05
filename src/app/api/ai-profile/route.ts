import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { interests, answers } = await req.json();

    if (!interests || interests.length === 0) {
      return NextResponse.json({ error: "No interests provided" }, { status: 400 });
    }

    // Using gemini-1.5-flash for speed or gemini-1.5-pro for higher quality
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an intelligent campus matchmaking AI for a platform called intrst (Find Your Actual People). 
A college student has selected these interests: ${interests.join(", ")}.
${answers ? `They also answered these introspective questions:
- Q: What's something most people don't know about you? A: ${answers.q1 || "not answered"}
- Q: What are you trying to figure out? A: ${answers.q2 || "not answered"}
- Q: What kind of person do you click with? A: ${answers.q3 || "not answered"}` : ""}

Based on this information, generate a HIGHLY CREATIVE and poetic match profile. Ensure the archetype feels unique and not generic.

Generate a JSON response with:
1. "personalityType": A creative 2-3 word personality archetype (e.g., "The Midnight Architect", "The Analog Dreamer", "The Kinetic Thinker")
2. "vibe": A poetic sentence describing their psychological energy (max 15 words)
3. "matchStyle": How they intuitively connect with others (max 20 words)
4. "compatibleWith": Array of 3 niche interest areas they'd click with someone over (e.g., "Obscure Cinema", "Recursive Algorithms", "Street Photography")
5. "matchCodename": A mysterious, evocative one-word codename (nature or abstract themed like Catalyst, Drift, Nocturne, Prism, Zenith)
6. "icebreaker": A high-impact, thought-provoking conversation starter (max 25 words)
7. "strengths": Array of 3 distinct personality strengths
8. "peopleLookingFor": 1 sentence describing the energy they'd most likely harmonize with (max 20 words)

Return ONLY a valid JSON object.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Robust cleaning for JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    const data = JSON.parse(text);

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("Gemini matching error:", err);
    // Return high-quality fallback if Gemini is not configured or fails
    return NextResponse.json({
      success: true,
      profile: {
        personalityType: "The Curious Voyager",
        vibe: "A quiet intensity driven by curiosity and a love for the complex.",
        matchStyle: "You connect through shared discovery and meaningful silence.",
        compatibleWith: ["Experimental Media", "Urban Exploration", "Deep Theory"],
        matchCodename: "Horizon",
        icebreaker: "If you could inhabit one piece of art for an afternoon, which one would it be?",
        strengths: ["Infinite Curiosity", "Radical Honesty", "Analytical Depth"],
        peopleLookingFor: "Someone who isn't afraid of the unasked questions.",
      },
      fallback: true,
    });
  }
}
