import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PeoplePage } from '@/features/people/PeoplePage';
import { PersonDetailPage } from '@/features/people/PersonDetailPage';
import { FunctionsPage } from '@/features/functions/FunctionsPage';
import { FunctionDetailPage } from '@/features/functions/FunctionDetailPage';
import { FunctionModePage } from '@/features/functionMode/FunctionModePage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Function Mode — full screen, outside layout */}
        <Route
          path="/functions/:id/mode"
          element={
            <ProtectedRoute>
              <FunctionModePage />
            </ProtectedRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="people/:id" element={<PersonDetailPage />} />
          <Route path="functions" element={<FunctionsPage />} />
          <Route path="functions/:id" element={<FunctionDetailPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
