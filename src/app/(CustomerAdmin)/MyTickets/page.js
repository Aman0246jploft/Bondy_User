"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedTickets from "@/components/Tickets/UnifiedTickets";

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <UnifiedTickets role="CUSTOMER" />
    </ProtectedRoute>
  );
}
