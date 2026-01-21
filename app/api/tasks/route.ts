import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateTaskSchema } from '@/lib/validations';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const workspaceId = searchParams.get('workspaceId');

    const where: any = {
      OR: [
        { userId: user.id },
        {
          workspace: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = CreateTaskSchema.parse(body);

    const task = await db.task.create({
      data: {
        userId: user.id,
        workspaceId: validatedData.workspaceId || null,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        version: 1,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await db.taskActivity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'CREATE',
      },
    });

    // Trigger AI enrichment asynchronously (non-blocking)
    if (process.env.OPENAI_API_KEY) {
      fetch(`${request.nextUrl.origin}/api/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      }).catch(console.error);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error creating task:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
