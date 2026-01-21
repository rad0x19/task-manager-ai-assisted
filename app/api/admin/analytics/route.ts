import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, unauthorizedResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const [
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalHabits,
      aiEnrichments,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      db.task.count(),
      db.task.count({
        where: {
          status: 'COMPLETED',
        },
      }),
      db.habit.count(),
      db.task.count({
        where: {
          metadata: {
            path: ['enriched'],
            equals: true,
          },
        },
      }),
    ]);

    // Task completion trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyCompletions = await db.task.groupBy({
      by: ['createdAt'],
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalHabits,
        aiEnrichments,
        enrichmentRate:
          totalTasks > 0 ? (aiEnrichments / totalTasks) * 100 : 0,
      },
      trends: {
        dailyCompletions: dailyCompletions.map((d) => ({
          date: d.createdAt,
          count: d._count.id,
        })),
        userGrowth: userGrowth.map((g) => ({
          date: g.createdAt,
          count: g._count.id,
        })),
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
