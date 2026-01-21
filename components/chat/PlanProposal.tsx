'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, Target } from 'lucide-react';

interface PlanProposalProps {
  plan: {
    summary: string;
    tasks: Array<{
      title: string;
      description?: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      dueDate?: string | null;
    }>;
    habits: Array<{
      name: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      goal?: string;
    }>;
  };
  conversationId?: string;
  onApprove: () => void;
  onReject: () => void;
}

export function PlanProposal({ plan, conversationId, onApprove, onReject }: PlanProposalProps) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!conversationId) return;

    setIsApproving(true);
    try {
      const response = await fetch('/api/chat/approve-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve plan');
      }

      const data = await response.json();
      alert(`Successfully created ${data.tasks.length} task(s) and ${data.habits.length} habit(s)!`);
      onApprove();
    } catch (error) {
      console.error('Error approving plan:', error);
      alert('Failed to approve plan. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-base">Proposed Plan</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{plan.summary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.tasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Tasks ({plan.tasks.length})
            </h4>
            <div className="space-y-2">
              {plan.tasks.map((task, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {task.description}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {plan.habits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Habits ({plan.habits.length})
            </h4>
            <div className="space-y-2">
              {plan.habits.map((habit, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{habit.name}</div>
                      {habit.goal && (
                        <div className="text-xs text-gray-600 mt-1">
                          {habit.goal}
                        </div>
                      )}
                      <Badge className={getFrequencyColor(habit.frequency)}>
                        {habit.frequency}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve All
          </Button>
          <Button
            onClick={onReject}
            variant="outline"
            disabled={isApproving}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
