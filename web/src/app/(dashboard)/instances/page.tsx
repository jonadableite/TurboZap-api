'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { InstanceList, CreateInstanceModal } from '@/components/instances';

export default function InstancesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Header
        title="Instâncias"
        description="Gerencie suas conexões WhatsApp"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-6xl mx-auto w-full">
        <InstanceList onCreateClick={() => setShowCreateModal(true)} />
      </div>

      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </>
  );
}

