import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UpdateTaskSchema } from '@/lib/validations';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';
import { canEditTask } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        user: true,
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

    return NextResponse.json(task);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = UpdateTaskSchema.parse(body);

    const existingTask = await db.task.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditTask(user, existingTask)) {
      return unauthorizedResponse();
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        version: existingTask.version + 1,
        lastSyncedAt: new Date(),
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
        action: 'UPDATE',
        metadata: validatedData,
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error updating task:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const existingTask = await db.task.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!canEditTask(user, existingTask)) {
      return unauthorizedResponse();
    }

    await db.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error deleting task:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
