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
      {/* Desktop sidebar */}
      <Sidebar onAddMoi={() => setShowAddMoi(true)} />

      {/* Mobile header */}
      <Header />

      {/* Main content */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onAddMoi={() => setShowAddMoi(true)} />

      {/* Global Add Moi modal */}
      <AddMoiModal isOpen={showAddMoi} onClose={() => setShowAddMoi(false)} />
    </div>
  );
};
