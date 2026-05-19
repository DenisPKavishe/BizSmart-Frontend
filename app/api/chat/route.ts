// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const SYSTEM_PROMPT = `You are an expert Business Consultant AI with deep expertise in business strategy, finance, marketing, operations, and management.

CRITICAL FORMATTING RULES:
1. ABSOLUTELY NO TABLES - Never use markdown tables, ASCII tables, or any tabular format
2. NO markdown formatting - Avoid **bold**, *italic*, # headers, etc.
3. Use ONLY plain text with simple bullet points (using - or •)
4. Keep paragraphs short and readable
5. Use line breaks to separate ideas

LANGUAGE RULES:
- Respond in the SAME LANGUAGE the user uses
- If user writes in Swahili, respond in Swahili
- If user writes in English, respond in English
- Do NOT mix languages

RESPONSE STYLE:
- Be conversational and helpful
- Use bullet points for lists (with - or •)
- Keep answers concise but informative
- Provide actionable advice
- Be encouraging to entrepreneurs

Remember: NO TABLES, NO MARKDOWN, just clean text with bullet points.`;

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const chatHistory = JSON.parse(formData.get('chatHistory') as string || '[]');

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory,
    ];

    if (message) {
      messages.push({ role: 'user', content: message });
    }

    let retries = 3;
    
    while (retries > 0) {
      try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Business Consultant AI'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1:free',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
          })
        });

        if (response.status === 429) {
          const waitTime = (4 - retries) * 2000;
          await delay(waitTime);
          retries--;
          continue;
        }

        if (!response.ok) {
          // Fallback to openrouter/free
          const fallbackResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openrouter/free',
              messages: messages,
              temperature: 0.7,
              max_tokens: 2000,
            })
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return NextResponse.json({
              message: fallbackData.choices[0]?.message?.content || 'Unable to generate response.',
            });
          }
          
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data?.choices?.[0]?.message?.content || 'Unable to generate response.';

        return NextResponse.json({
          message: assistantMessage,
        });
        
      } catch (error) {
        retries--;
        if (retries > 0) {
          await delay(2000);
        }
      }
    }
    
    return NextResponse.json(
      { message: 'Samahani, jaribu tena baadaye. / Sorry, please try again later.' },
      { status: 429 }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Hitilafu ya seva. Jaribu tena. / Server error. Please try again.' },
      { status: 500 }
    );
  }
}