"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrganizerOrders from "@/components/Tickets/OrganizerOrders";

export default function MyTicketsOrganiserPage() {
  return (
    <ProtectedRoute>
      <OrganizerOrders />
    </ProtectedRoute>
  );
}
