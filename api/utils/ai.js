import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  try {
    const supportAgent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash-8b",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Triage Assistant",
      system: `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- You MUST return a complete JSON object with ALL fields: summary, priority, helpfulNotes, and relatedSkills.
- The priority MUST be one of: "low", "medium", or "high".
- The relatedSkills MUST be an array of strings.
- Do NOT return just an array or partial data.
- Do NOT include markdown, code fences, or any extra formatting.

Example of required format:
{
  "summary": "User is experiencing issues with React component rendering",
  "priority": "high",
  "helpfulNotes": "Check component lifecycle and state management. Consider using React DevTools for debugging.",
  "relatedSkills": ["React", "JavaScript", "Frontend Development"]
}`,
    });

    console.log("Sending request to Gemini API...");
    const response = await supportAgent.run(`Analyze this support ticket and return a complete JSON object with ALL required fields.

REQUIRED FIELDS:
- summary: A short 1-2 sentence summary of the issue
- priority: Must be one of "low", "medium", or "high"
- helpfulNotes: Detailed technical explanation with resources
- relatedSkills: Array of required technical skills

Ticket information:
Title: ${ticket.title}
Description: ${ticket.description}

Remember: Return ONLY a complete JSON object with ALL fields. Do not return partial data or just an array.`);

    console.log("Received response from Gemini:", JSON.stringify(response, null, 2));

    // Check if response has the expected structure
    if (!response || !response.output || !Array.isArray(response.output)) {
      console.error("Invalid response structure:", response);
      throw new Error("Invalid response structure from Gemini API");
    }

    // Get the raw response text
    const rawResponse = response.output[0]?.text || response.output[0]?.content || response.output[0]?.context;
    
    if (!rawResponse) {
      console.error("No text content in response:", response);
      throw new Error("No text content in Gemini API response");
    }

    console.log("Raw response:", rawResponse);
    
    // Try to parse the response directly first
    try {
      const parsed = JSON.parse(rawResponse);
      // Validate the required fields
      if (!parsed.summary || !parsed.priority || !parsed.helpfulNotes || !Array.isArray(parsed.relatedSkills)) {
        throw new Error("Missing required fields in response");
      }
      return parsed;
    } catch (e) {
      console.log("Direct parsing failed, trying alternative methods...");
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (!parsed.summary || !parsed.priority || !parsed.helpfulNotes || !Array.isArray(parsed.relatedSkills)) {
          throw new Error("Missing required fields in response");
        }
        return parsed;
      }
      
      // If no markdown blocks found, try to find JSON-like content
      const jsonLikeMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonLikeMatch) {
        const parsed = JSON.parse(jsonLikeMatch[0]);
        if (!parsed.summary || !parsed.priority || !parsed.helpfulNotes || !Array.isArray(parsed.relatedSkills)) {
          throw new Error("Missing required fields in response");
        }
        return parsed;
      }
      
      throw new Error("Could not find valid JSON in response");
    }
  } catch (e) {
    console.error("Failed to analyze ticket:", e.message);
    console.error("Full error:", e);
    // Return a default response instead of null
    return {
      summary: "Failed to analyze ticket",
      priority: "medium",
      helpfulNotes: "AI analysis failed. Please review manually.",
      relatedSkills: ["general"]
    };
  }
};

export default analyzeTicket; 