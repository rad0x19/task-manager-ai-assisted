import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const habit = await db.habit.findUnique({
      where: { id: params.id },
    });

    if (!habit || habit.userId !== user.id) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const lastCompleted = habit.lastCompletedAt
      ? new Date(habit.lastCompletedAt)
      : null;

    let newStreak = habit.streak;
    let shouldIncrement = false;

    if (!lastCompleted) {
      // First completion
      shouldIncrement = true;
    } else {
      const daysDiff = Math.floor(
        (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Already completed today
        return NextResponse.json(habit);
      } else if (daysDiff === 1) {
        // Consecutive day
        shouldIncrement = true;
      } else {
        // Streak broken, reset
        newStreak = 1;
      }
    }

    if (shouldIncrement) {
      newStreak = habit.streak + 1;
    }

    const updatedHabit = await db.habit.update({
      where: { id: params.id },
      data: {
        streak: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
        lastCompletedAt: now,
      },
    });

    return NextResponse.json(updatedHabit);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error completing habit:', error);
    return NextResponse.json(
      { error: 'Failed to complete habit' },
      { status: 500 }
    );
  }
}
