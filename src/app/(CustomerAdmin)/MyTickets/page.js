"use client";

import React, { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedTickets from "@/components/Tickets/UnifiedTickets";

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <UnifiedTickets role="CUSTOMER" />
      </Suspense>
    </ProtectedRoute>
  );
}
