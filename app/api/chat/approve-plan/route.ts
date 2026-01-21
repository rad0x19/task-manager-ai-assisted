import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApprovePlanSchema } from '@/lib/validations';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = ApprovePlanSchema.parse(body);

    // Get conversation and verify ownership
    const conversation = await db.chatConversation.findUnique({
      where: { id: validatedData.conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== user.id) {
      return unauthorizedResponse();
    }

    if (!conversation.plan) {
      return NextResponse.json(
        { error: 'No plan to approve' },
        { status: 400 }
      );
    }

    const plan = conversation.plan as any;
    const createdTasks = [];
    const createdHabits = [];

    // Create tasks from plan
    if (plan.tasks && Array.isArray(plan.tasks)) {
      for (const taskData of plan.tasks) {
        const task = await db.task.create({
          data: {
            userId: user.id,
            workspaceId: validatedData.workspaceId || null,
            title: taskData.title,
            description: taskData.description || null,
            priority: taskData.priority || 'MEDIUM',
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            version: 1,
          },
        });
        createdTasks.push(task);

        // Log activity
        await db.taskActivity.create({
          data: {
            taskId: task.id,
            userId: user.id,
            action: 'CREATE',
            metadata: { source: 'ai_chat' },
          },
        });
      }
    }

    // Create habits from plan
    if (plan.habits && Array.isArray(plan.habits)) {
      for (const habitData of plan.habits) {
        const habit = await db.habit.create({
          data: {
            userId: user.id,
            name: habitData.name,
            frequency: habitData.frequency,
            metadata: habitData.goal ? { goal: habitData.goal } : undefined,
          },
        });
        createdHabits.push(habit);
      }
    }

    // Update conversation status
    await db.chatConversation.update({
      where: { id: validatedData.conversationId },
      data: {
        status: 'COMPLETED',
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      tasks: createdTasks,
      habits: createdHabits,
      message: `Created ${createdTasks.length} task(s) and ${createdHabits.length} habit(s)`,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error approving plan:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to approve plan' },
      { status: 500 }
    );
  }
}
