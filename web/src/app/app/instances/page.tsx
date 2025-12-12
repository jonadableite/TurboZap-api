"use client";

import { CreateInstanceModal, InstanceList } from "@/components/instances";
import { Header } from "@/components/layout";
import { useState } from "react";

export default function InstancesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Header
        title="Instâncias"
        description="Gerencie suas instâncias WhatsApp"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
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

