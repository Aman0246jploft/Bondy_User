"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnifiedTickets from "@/components/Tickets/UnifiedTickets";

export default function MyTicketsOrganiserPage() {
  return (
    <ProtectedRoute>
      <UnifiedTickets role="ORGANIZER" />
    </ProtectedRoute>
  );
}
