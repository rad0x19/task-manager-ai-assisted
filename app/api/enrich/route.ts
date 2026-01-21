import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrichTask } from '@/lib/openai';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (task.userId !== user.id && !task.workspace) {
      return unauthorizedResponse();
    }

    // Enrich task with AI
    const enrichment = await enrichTask(task.title, task.description || undefined);

    // Update task with enrichment data
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        category: enrichment.category || null,
        tags: enrichment.tags || null,
        metadata: {
          ...(task.metadata as any || {}),
          ...enrichment,
          enriched: true,
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error enriching task:', error);
    // Don't fail the request if enrichment fails
    return NextResponse.json(
      { error: 'Enrichment failed, but task was created' },
      { status: 500 }
    );
  }
}
