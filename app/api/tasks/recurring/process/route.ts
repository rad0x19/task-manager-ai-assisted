import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateNextOccurrence, shouldSkipOccurrence } from '@/lib/recurring';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Find all tasks with recurring rules
    const recurringTasks = await db.task.findMany({
      where: {
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
        recurringRule: { not: null },
        status: 'COMPLETED',
      },
    });

    const createdTasks = [];

    for (const task of recurringTasks) {
      if (!task.recurringRule) continue;

      const rule = task.recurringRule as any;
      const lastOccurrence = task.completedAt || task.createdAt;

      if (shouldSkipOccurrence(rule, lastOccurrence, task.status === 'COMPLETED')) {
        continue;
      }

      const nextDate = calculateNextOccurrence(rule, lastOccurrence);

      if (!nextDate) {
        // Recurring rule has ended
        continue;
      }

      // Create next occurrence
      const newTask = await db.task.create({
        data: {
          userId: task.userId,
          workspaceId: task.workspaceId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          tags: task.tags,
          recurringRule: rule,
          dueDate: nextDate,
          status: 'PENDING',
          version: 1,
        },
      });

      createdTasks.push(newTask);
    }

    return NextResponse.json({
      processed: recurringTasks.length,
      created: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error processing recurring tasks:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring tasks' },
      { status: 500 }
    );
  }
}
