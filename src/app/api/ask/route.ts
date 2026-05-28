import { NextResponse } from 'next/server';
import { profileData } from '@/lib/profileData';
import { getExperienceDuration, formatExperience } from '@/lib/dateUtils';
import { askAgent } from '@/lib/agentLogic';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.PORTFOLIO_API_KEY;
    if (!apiKey) {
      console.warn("PORTFOLIO_API_KEY is not defined in env. Falling back to local agent.");
      const fallback = askAgent(query);
      return NextResponse.json(fallback);
    }

    // Calculate dynamic experience duration
    const exp = formatExperience(getExperienceDuration(profileData.experienceStart));

    // Construct the context system prompt
    const systemPrompt = `You are a helpful, professional, and friendly AI assistant representing Shubham Roy.
You only answer questions about Shubham Roy using the context details below. 
Speak in the first person ("I", "my", "me") as if you are Shubham himself. Keep answers concise, premium, and focused (around 2-3 sentences max).
If the user asks something completely unrelated to Shubham's professional or personal background, politely state that you can only answer questions related to Shubham Roy, and suggest they use the "Contact Me" option below.

Context about Shubham Roy:
- Full Name: ${profileData.fullName}
- Profession: ${profileData.profession}
- Current Experience: ${exp} of professional experience (dynamic calculation)
- Location: ${profileData.location}
- Availability: ${profileData.availability}
- Languages: ${profileData.languages.join(', ')}
- Location: ${profileData.contact.location}
- Email: ${profileData.contact.email}
- Phone: ${profileData.contact.phone}
- Behance: ${profileData.socials.behance}
- LinkedIn: ${profileData.socials.linkedin}

About Me summary:
${profileData.aboutMe}

Design Philosophy:
"${profileData.designPhilosophy.statement}"
Focus Areas: ${profileData.designPhilosophy.focusAreas.join(', ')}

Inspiration:
${profileData.inspiration}

Experience Timeline:
${profileData.experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`).join('\n')}

Skills:
${profileData.skills.join(', ')}

AI Experience & Tools:
Summary: ${profileData.aiExperience.summary}
Tools Used: ${profileData.aiExperience.tools.join(', ')}

Tools & Software:
- Design: ${profileData.tools.design.join(', ')}
- Motion: ${profileData.tools.motion.join(', ')}
- Dev: ${profileData.tools.development.join(', ')}

Estimation of work:
- Basic Website: ${profileData.estimations.basicWebsite}
- Portfolio Website: ${profileData.estimations.portfolioWebsite}
- Advanced SaaS Dashboard: ${profileData.estimations.advancedDashboard}
- Full Product Ecosystem: ${profileData.estimations.fullEcosystem}

Long-term Goals:
${profileData.longTermGoals}
`;

    // Attempt OpenAI or standard OpenAI-compatible completions
    try {
      const apiUrl = process.env.PORTFOLIO_API_URL || 'https://api.openai.com/v1';
      const apiModel = process.env.PORTFOLIO_API_MODEL || 'gpt-4o-mini';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 250,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return NextResponse.json({ answer: text, generic: false });
        }
      }
    } catch (apiError) {
      console.warn("OpenAI API call failed, trying Gemini API fallback...", apiError);
    }

    // Try Gemini API as a secondary fallback if OpenAI format fails or is blocked
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nUser Question: ${query}` }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return NextResponse.json({ answer: text, generic: false });
        }
      }
    } catch (geminiError) {
      console.warn("Gemini API call failed, falling back to local model...", geminiError);
    }

    // Final Graceful Fallback: Local rule-based keyword matching
    console.warn("All live API calls failed. Falling back to local agent logic.");
    const fallback = askAgent(query);
    return NextResponse.json(fallback);

  } catch (err) {
    console.error("Critical error in ask route:", err);
    return NextResponse.json({ 
      answer: "I experienced a brief server timeout, but I would love to connect with you directly!", 
      generic: true 
    });
  }
}
