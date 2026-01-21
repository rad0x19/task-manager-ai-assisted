'use client';

import { CheckSquare } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <CheckSquare className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No tasks yet
      </h3>
      <p className="text-sm text-gray-600 max-w-sm">
        Get started by creating your first task. AI will automatically enrich it
        with categories and tags to help you stay organized.
      </p>
    </div>
  );
}
