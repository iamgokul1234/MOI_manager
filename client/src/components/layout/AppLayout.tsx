import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { AddMoiModal } from '@/features/transactions/AddMoiModal';

export const AppLayout: React.FC = () => {
  const [showAddMoi, setShowAddMoi] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onAddMoi={() => setShowAddMoi(true)} />
      <Header />

      <main className="md:ml-64 pt-14 md:pt-0 pb-24 md:pb-8 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 md:py-8">
          <Outlet />
        </div>
      </main>

      <BottomNav onAddMoi={() => setShowAddMoi(true)} />

      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} />
    </div>
  );
};
