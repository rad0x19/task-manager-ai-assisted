'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Analytics {
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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!analytics) {
    return <div>Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600 mt-1">Your productivity insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.averageCompletionTime.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Completed: {analytics.tasksCompleted}</div>
              <div>In Progress: {analytics.tasksInProgress}</div>
              <div>Pending: {analytics.tasksPending}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak Productivity Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.peakHours.map((item) => (
                <div key={item.hour} className="flex items-center justify-between">
                  <span>{item.hour}:00</span>
                  <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...analytics.peakHours.map((h) => h.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{item.count} tasks</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.categoryDistribution.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span>{item.category}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
