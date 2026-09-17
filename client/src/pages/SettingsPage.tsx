import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const handleLogout = async () => {
    await logout();
    success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
          <User className="h-4 w-4 text-gray-400" />
          <span>{user?.email}</span>
        </div>
        <Button variant="danger" icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
          Sign Out
        </Button>
      </Card>

      <Card className="border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-700 mb-2 text-sm">About</h2>
        <p className="text-sm text-gray-500">
          Moi Management v1.0.0 — Track gift money at family functions.
          Built with React, Node.js, and MongoDB.
        </p>
      </Card>
    </div>
  );
};
