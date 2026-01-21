import { db } from './db';
import { Task } from '@prisma/client';

export interface Conflict {
  taskId: string;
  serverVersion: Task;
  clientVersion: Task;
}

export interface SyncResult {
  conflicts: Conflict[];
  updates: Task[];
  serverTasks: Task[];
}

export async function syncTasks(
  userId: string,
  clientTasks: Task[],
  lastSyncTime: Date
): Promise<SyncResult> {
  const serverTasks = await db.task.findMany({
    where: {
      OR: [
        { userId },
        {
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      ],
      updatedAt: { gte: lastSyncTime },
    },
  });

  const conflicts: Conflict[] = [];
  const updates: Task[] = [];

  for (const clientTask of clientTasks) {
    const serverTask = serverTasks.find((t) => t.id === clientTask.id);

    if (!serverTask) {
      // New task from client
      updates.push(clientTask);
    } else if (serverTask.version !== clientTask.version) {
      // Conflict detected
      conflicts.push({
        taskId: clientTask.id,
        serverVersion: serverTask,
        clientVersion: clientTask,
      });
    }
  }

  return { conflicts, updates, serverTasks };
}

export async function resolveConflict(
  taskId: string,
  resolution: 'SERVER' | 'CLIENT' | 'MERGE',
  mergedData?: Partial<Task>
) {
  const conflict = await db.taskConflict.findFirst({
    where: {
      taskId,
      resolvedAt: null,
    },
  });

  if (!conflict) {
    throw new Error('Conflict not found');
  }

  let taskData: Partial<Task>;

  if (resolution === 'SERVER') {
    taskData = conflict.serverVersion as any;
  } else if (resolution === 'CLIENT') {
    taskData = conflict.clientVersion as any;
  } else {
    // MERGE
    taskData = mergedData || conflict.serverVersion as any;
  }

  // Exclude fields that cannot be updated in Prisma
  const { id, userId, createdAt, updatedAt, ...updateableFields } = taskData;

  // Convert null to undefined for Prisma update (Prisma update input doesn't accept null)
  const updateData: any = {};
  for (const [key, value] of Object.entries(updateableFields)) {
    updateData[key] = value === null ? undefined : value;
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      ...updateData,
      version: (taskData.version as number) + 1,
      lastSyncedAt: new Date(),
    },
  });

  await db.taskConflict.update({
    where: { id: conflict.id },
    data: {
      resolution,
      resolvedAt: new Date(),
    },
  });

  return task;
}
