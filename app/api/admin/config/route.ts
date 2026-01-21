import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';
import { z } from 'zod';

// In a real app, this would be stored in a database
// For now, we'll use environment variables and a simple in-memory config

const AIConfigSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().optional(),
  rateLimit: z.number().optional(),
  promptTemplate: z.string().optional(),
});

let aiConfig = {
  enabled: !!process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  rateLimit: parseInt(process.env.OPENAI_RATE_LIMIT || '60'),
  promptTemplate: process.env.OPENAI_PROMPT_TEMPLATE || '',
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      ai: aiConfig,
      system: {
        maintenanceMode: false,
        featureFlags: {
          habits: true,
          analytics: true,
          workspaces: true,
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { section, ...data } = body;

    if (section === 'ai') {
      const validatedData = AIConfigSchema.parse(data);
      aiConfig = { ...aiConfig, ...validatedData };
    }

    return NextResponse.json({
      ai: aiConfig,
      message: 'Configuration updated',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error updating config:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
