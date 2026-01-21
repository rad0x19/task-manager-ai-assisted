import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';
import { z } from 'zod';

const CreateHabitSchema = z.object({
  name: z.string().min(1).max(100),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

const UpdateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const habits = await db.habit.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(habits);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = CreateHabitSchema.parse(body);

    const habit = await db.habit.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        frequency: validatedData.frequency,
        streak: 0,
        longestStreak: 0,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error creating habit:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const habitId = body.id;
    const validatedData = UpdateHabitSchema.parse(body);

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    const existingHabit = await db.habit.findUnique({
      where: { id: habitId },
    });

    if (!existingHabit || existingHabit.userId !== user.id) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    const habit = await db.habit.update({
      where: { id: habitId },
      data: validatedData,
    });

    return NextResponse.json(habit);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error updating habit:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}
