import { db } from './db';

export interface ProductivityMetrics {
  completionRate: number;
  averageCompletionTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  priorityEffectiveness: {
    high: number;
    medium: number;
    low: number;
  };
  tasksCompleted: number;
  tasksPending: number;
  tasksInProgress: number;
}

export async function calculateUserAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProductivityMetrics> {
  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.gte = startDate;
    if (endDate) dateFilter.createdAt.lte = endDate;
  }

  const tasks = await db.task.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    include: {
      activities: {
        where: {
          action: 'COMPLETE',
        },
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
  });

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');

  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Calculate average completion time
  let totalTime = 0;
  let completedWithTime = 0;

  for (const task of completedTasks) {
    if (task.completedAt && task.createdAt) {
      const timeDiff =
        task.completedAt.getTime() - task.createdAt.getTime();
      totalTime += timeDiff;
      completedWithTime++;
    }
  }

  const averageCompletionTime =
    completedWithTime > 0 ? totalTime / completedWithTime : 0;

  // Peak hours analysis
  const hourCounts: Record<number, number> = {};
  for (const task of completedTasks) {
    if (task.completedAt) {
      const hour = task.completedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }

  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  for (const task of tasks) {
    if (task.category) {
      categoryCounts[task.category] =
        (categoryCounts[task.category] || 0) + 1;
    }
  }

  const categoryDistribution = Object.entries(categoryCounts).map(
    ([category, count]) => ({ category, count })
  );

  // Priority effectiveness
  const priorityStats = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const task of completedTasks) {
    if (task.priority === 'HIGH') priorityStats.high++;
    else if (task.priority === 'MEDIUM') priorityStats.medium++;
    else priorityStats.low++;
  }

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime / (1000 * 60 * 60)), // Convert to hours
    peakHours,
    categoryDistribution,
    priorityEffectiveness: priorityStats,
    tasksCompleted: completedTasks.length,
    tasksPending: pendingTasks.length,
    tasksInProgress: inProgressTasks.length,
  };
}
