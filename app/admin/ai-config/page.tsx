'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AIConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'ai',
          ...config.ai,
        }),
      });
      if (response.ok) {
        alert('Configuration saved');
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">AI Configuration</h2>
        <p className="text-gray-600 mt-1">Configure AI enrichment settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={config?.ai?.model || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  ai: { ...config.ai, model: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Rate Limit (requests per minute)</Label>
            <Input
              type="number"
              value={config?.ai?.rateLimit || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  ai: { ...config.ai, rateLimit: parseInt(e.target.value) },
                })
              }
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
