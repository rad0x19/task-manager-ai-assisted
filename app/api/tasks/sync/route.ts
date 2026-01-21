import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';
import { syncTasks, resolveConflict } from '@/lib/sync';
import { z } from 'zod';

const SyncRequestSchema = z.object({
  lastSyncTime: z.string().datetime(),
  clientTasks: z.array(z.any()),
});

const ResolveConflictSchema = z.object({
  taskId: z.string().uuid(),
  resolution: z.enum(['SERVER', 'CLIENT', 'MERGE']),
  mergedData: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const lastSyncTime = searchParams.get('lastSyncTime');

    if (!lastSyncTime) {
      return NextResponse.json(
        { error: 'lastSyncTime is required' },
        { status: 400 }
      );
    }

    const result = await syncTasks(user.id, [], new Date(lastSyncTime));

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error syncing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to sync tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = SyncRequestSchema.parse(body);

    const result = await syncTasks(
      user.id,
      validatedData.clientTasks,
      new Date(validatedData.lastSyncTime)
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error syncing tasks:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to sync tasks' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validatedData = ResolveConflictSchema.parse(body);

    const task = await resolveConflict(
      validatedData.taskId,
      validatedData.resolution,
      validatedData.mergedData
    );

    return NextResponse.json(task);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error resolving conflict:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}
