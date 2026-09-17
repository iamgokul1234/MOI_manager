import React from 'react';
import { Coins } from 'lucide-react';

/** Shared centered card layout for the login and register pages. */
export const AuthShell: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Coins className="h-8 w-8 text-white" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Moi Management</h1>
        <p className="text-gray-500 text-sm mt-1">Your family's Moi book, digital</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>
        {children}
      </div>
    </div>
  </div>
);
