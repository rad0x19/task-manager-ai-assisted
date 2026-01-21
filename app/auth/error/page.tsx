'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Authentication is not properly configured. Please check your environment variables (NEXTAUTH_SECRET and NEXTAUTH_URL).';
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
          <CardDescription>{getErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error === 'Configuration' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                <p className="font-semibold mb-2">Configuration Issue:</p>
                <p>Please ensure the following environment variables are set in your .env.local file:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code>NEXTAUTH_SECRET</code> - Generate with: <code>openssl rand -base64 32</code></li>
                  <li><code>NEXTAUTH_URL</code> - Your app URL (e.g., http://localhost:3000)</li>
                  <li><code>DATABASE_URL</code> - PostgreSQL connection string</li>
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login">Back to Login</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
