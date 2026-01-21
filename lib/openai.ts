import OpenAI from 'openai';
import { PlanProposal, PlanProposalSchema } from './validations';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enrichTask(
  title: string,
  description?: string
): Promise<{
  category?: string;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  estimatedDuration?: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a task management assistant. Analyze tasks and return a JSON object with:
- category: A single category name (e.g., "Work", "Personal", "Shopping", "Health")
- tags: An array of 2-5 relevant tags (e.g., ["urgent", "meeting", "project"])
- sentiment: One of "positive", "neutral", or "negative" based on task tone
- estimatedDuration: Estimated time in minutes (number)

Return only valid JSON.`,
        },
        {
          role: 'user',
          content: `Task: ${title}\nDescription: ${description || 'None'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return {
      category: parsed.category,
      tags: parsed.tags || [],
      sentiment: parsed.sentiment || 'neutral',
      estimatedDuration: parsed.estimatedDuration || null,
    };
  } catch (error) {
    console.error('OpenAI enrichment error:', error);
    // Return default values on error
    return {
      category: undefined,
      tags: [],
      sentiment: 'neutral',
      estimatedDuration: undefined,
    };
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: string
): Promise<{
  response: string;
  planProposal?: PlanProposal;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const systemPrompt = `You are a helpful task management assistant. Your goal is to help users create actionable tasks and habits through natural conversation.

Guidelines:
1. Start with guided questions to understand user goals
2. Ask clarifying questions when needed
3. After gathering enough information, propose a structured plan
4. The plan should include:
   - Tasks with titles, descriptions, priorities, due dates (if mentioned)
   - Habits with names, frequencies, and goals
5. Wait for user approval before creating items
6. Be conversational and friendly, not robotic

When proposing a plan, include a JSON structure in your response (either in a code block or inline):
{
  "summary": "Brief summary of the plan",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "LOW|MEDIUM|HIGH",
      "dueDate": "ISO date string or null"
    }
  ],
  "habits": [
    {
      "name": "Habit name",
      "frequency": "daily|weekly|monthly",
      "goal": "Brief goal description"
    }
  ]
}

If you're not ready to propose a plan yet, just continue the conversation naturally.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Try to extract plan proposal from response
    const planProposal = extractPlanProposal(content);
    
    // Clean the response by removing JSON code blocks if a plan was extracted
    let cleanedContent = content;
    if (planProposal) {
      // Remove JSON code blocks from the response
      cleanedContent = content
        .replace(/```json\s*[\s\S]*?```/g, '')
        .replace(/```\s*[\s\S]*?```/g, '')
        .replace(/\{[\s\S]*"summary"[\s\S]*\}/g, '')
        .trim();
      
      // If the cleaned content is too short or empty, add a friendly message
      if (cleanedContent.length < 20) {
        cleanedContent = "I've prepared a plan for you based on our conversation. Please review it below and let me know if you'd like to approve it or make any changes.";
      }
    }
    
    return {
      response: cleanedContent,
      planProposal,
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw error;
  }
}

function extractPlanProposal(content: string): PlanProposal | undefined {
  try {
    // Try to find JSON in markdown code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      const parsed = JSON.parse(codeBlockMatch[1]);
      return PlanProposalSchema.parse(parsed);
    }

    // Try to find JSON object directly
    const jsonMatch = content.match(/\{[\s\S]*"summary"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return PlanProposalSchema.parse(parsed);
    }

    return undefined;
  } catch (error) {
    console.error('Error extracting plan proposal:', error);
    return undefined;
  }
}
