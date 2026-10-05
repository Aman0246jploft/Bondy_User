"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedMessages from "@/components/Messages/UnifiedMessages";

export default function OrganizerMessagePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="text-center p-5 text-muted">Loading messages...</div>}>
        <UnifiedMessages />
      </Suspense>
    </ProtectedRoute>
  );
}
