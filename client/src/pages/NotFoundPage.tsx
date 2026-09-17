import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full text-center space-y-4">
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto text-primary-600">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
      <p className="text-gray-500 text-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="pt-2">
        <Link to="/dashboard">
          <Button icon={<Home className="h-4 w-4" />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  </div>
);
