"use client";

import React, { Suspense } from "react";
import TicketDetailView from "@/components/Tickets/TicketDetailView";

export default function OrganizerBookingDetailPage() {
  return (
    <Suspense fallback={null}>
      <TicketDetailView />
    </Suspense>
  );
}
