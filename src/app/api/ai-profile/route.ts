import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { interests, answers } = await req.json();

    if (!interests || interests.length === 0) {
      return NextResponse.json({ error: "No interests provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an intelligent campus matchmaking AI for a platform called HMU (Find Your People). 
A college student has selected these interests: ${interests.join(", ")}.
${answers ? `They also answered these questions:
- Q: What's something most people don't know about you? A: ${answers.q1 || "not answered"}
- Q: What are you trying to figure out? A: ${answers.q2 || "not answered"}
- Q: What kind of person do you click with? A: ${answers.q3 || "not answered"}` : ""}

Based on this information, generate a JSON response with:
1. "personalityType": A creative 2-3 word personality archetype (e.g., "The Quiet Creator", "The Curious Wanderer", "The Night Thinker")
2. "vibe": One sentence describing their energy (max 15 words)
3. "matchStyle": How they likely connect with people (max 20 words)
4. "compatibleWith": Array of 3 interest areas they would likely click with someone over
5. "matchCodename": A mysterious poetic codename for their anonymous match profile (one word, nature/element themed, like Ember, Tide, Solstice, Drift, Prism, Echo)
6. "icebreaker": A single unique conversation prompt tailored to their interests (max 25 words, starts with "Would you rather..." or "What if..." or a thought-provoking question)
7. "strengths": Array of 3 short personality strengths based on their interests
8. "peopleLookingFor": 1 sentence describing the type of person they'd connect with (max 20 words)

Respond with ONLY valid JSON, no markdown, no explanation.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean up any markdown if present
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("Gemini error:", err);
    // Return fallback if Gemini is not configured
    return NextResponse.json({
      success: true,
      profile: {
        personalityType: "The Curious Explorer",
        vibe: "Someone who finds meaning in small details and deep conversations.",
        matchStyle: "You connect slowly but deeply, preferring real over small talk.",
        compatibleWith: ["Creative pursuits", "Intellectual curiosity", "Late-night adventures"],
        matchCodename: "Ember",
        icebreaker: "What's a hobby you picked up that completely changed how you see the world?",
        strengths: ["Deep listener", "Creative thinker", "Genuine connector"],
        peopleLookingFor: "Someone who stays curious and doesn't mind a bit of chaos.",
      },
      fallback: true,
    });
  }
}
